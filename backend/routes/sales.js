// routes/sales.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ----------------- Helpers -----------------
const pad = (num, size = 4) => num.toString().padStart(size, "0");
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const r2 = (x) => Number((n(x)).toFixed(2));

// Generate invoice number like: INV-YYYYMMDD-0001 (per day running)
async function generateInvoiceNo(connOrPool) {
  // Use connection if passed, otherwise pool
  const dbi = connOrPool || db;
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const [rows] = await dbi.query(
    "SELECT COUNT(*) AS count FROM sales WHERE DATE(created_at) = CURDATE()"
  );
  const count = rows?.[0]?.count || 0;
  return `INV-${todayStr}-${pad(count + 1)}`;
}

// FIFO stock deduction (reduce purchase_items.sold_qty)
async function reduceStockFIFO(conn, items) {
  for (const it of items) {
    let remaining = n(it.quantity, 0);
    if (remaining <= 0) continue;

    // If batch is provided, try to consume that batch first
    if (it.batch_no) {
      const [btRows] = await conn.query(
        `SELECT id, quantity, sold_qty
           FROM purchase_items
          WHERE medicine_id = ? AND batch_no = ? AND (quantity - sold_qty) > 0
          ORDER BY expiry_date ASC, id ASC`,
        [it.medicine_id, it.batch_no]
      );

      for (const b of btRows) {
        const available = n(b.quantity) - n(b.sold_qty);
        if (available <= 0) continue;
        const useQty = Math.min(available, remaining);

        await conn.query(
          `UPDATE purchase_items
              SET sold_qty = sold_qty + ?
            WHERE id = ?`,
          [useQty, b.id]
        );

        remaining -= useQty;
        if (remaining <= 0) break;
      }
    }

    // If still remaining (no/insufficient batch match), consume other batches FIFO (earliest expiry first)
    if (remaining > 0) {
      const [rows] = await conn.query(
        `SELECT id, quantity, sold_qty
           FROM purchase_items
          WHERE medicine_id = ? AND (quantity - sold_qty) > 0
          ORDER BY expiry_date ASC, id ASC`,
        [it.medicine_id]
      );

      for (const b of rows) {
        const available = n(b.quantity) - n(b.sold_qty);
        if (available <= 0) continue;
        const useQty = Math.min(available, remaining);

        await conn.query(
          `UPDATE purchase_items
              SET sold_qty = sold_qty + ?
            WHERE id = ?`,
          [useQty, b.id]
        );

        remaining -= useQty;
        if (remaining <= 0) break;
      }
    }
  }
}

// =======================
// ✅ Save Sale (POST /api/sales)
// =======================
router.post("/", async (req, res) => {
  const { customer_id, total_amount, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Generate invoice number with the same connection (to avoid race)
    const invoice_number = await generateInvoiceNo(conn);

    // Recalculate totals (never trust client)
    let subtotal = 0, discount = 0, sgstAmount = 0, cgstAmount = 0;

    const normalizedItems = items.map((it) => {
      const qty = n(it.quantity, 0);
      const rate = n(it.price, 0);
      const discAmount = n(it.discount_amount, 0); // frontend sends line discount amount
      const gstRate = n(it.gst_rate, 0);

      const lineSub = r2(qty * rate);
      const baseAfterDisc = r2(lineSub - discAmount);
      const sgst = r2((baseAfterDisc * (gstRate / 2)) / 100);
      const cgst = r2((baseAfterDisc * (gstRate / 2)) / 100);
      const lineTotal = r2(baseAfterDisc + sgst + cgst);

      subtotal += lineSub;
      discount += discAmount;
      sgstAmount += sgst;
      cgstAmount += cgst;

      return {
        medicine_id: it.medicine_id,
        product_name: it.name || it.product_name || "",
        batch_no: it.batch_no || it.batch || "",
        expiry_date: it.expiry_date || it.expiry || null,
        pack: it.pack || null,
        hsn: it.hsn || null,
        qty,
        rate,
        mrp: n(it.mrp_price, 0),
        gst_rate: gstRate, // percentage
        disc: n(it.disc, 0), // percentage (if you save)
        discount_amount: discAmount, // absolute
        amount: lineTotal, // absolute
      };
    });

    const computedTotal = r2(subtotal - discount + sgstAmount + cgstAmount);
    const grandTotal = n(total_amount, computedTotal) || computedTotal;

    // Insert into sales
    const [saleResult] = await conn.query(
      `INSERT INTO sales
         (invoice_number, customer_id, subtotal, discount, sgst, cgst, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        n(customer_id),
        r2(subtotal),
        r2(discount),
        r2(sgstAmount),
        r2(cgstAmount),
        r2(grandTotal),
      ]
    );
    const saleId = saleResult.insertId;

    // Insert each item
    for (const it of normalizedItems) {
      await conn.query(
        `INSERT INTO sales_items
           (sale_id, medicine_id, product_name, batch, pack, expiry, hsn,
            qty, rate, mrp, disc, sgst, cgst, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          saleId,
          it.medicine_id,
          it.product_name,
          it.batch_no,
          it.pack,
          it.expiry_date,
          it.hsn,
          it.qty,
          it.rate,
          it.mrp,
          it.disc || 0,            // percentage (if you store)
          r2(it.gst_rate / 2),     // store percentage half as sgst
          r2(it.gst_rate / 2),     // store percentage half as cgst
          it.amount,
        ]
      );
    }

    // ✅ Reduce stock FIFO from purchase_items
    await reduceStockFIFO(conn, normalizedItems);

    await conn.commit();
    return res.json({
      success: true,
      message: "✅ Sale saved successfully",
      saleId,
      invoice_number,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Sale Save Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to save sale", details: err.message });
  } finally {
    conn.release();
  }
});

// =======================
// ✅ Get all sales (GET /api/sales)
// =======================
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.invoice_number, s.total, s.created_at,
             c.name AS customer_name
        FROM sales s
   LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.created_at DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error("Error fetching sales:", err);
    return res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// =======================
// ✅ Get single invoice with items (GET /api/sales/:id)
// =======================
router.get("/:id", async (req, res) => {
  try {
    const [sale] = await db.query(
      `SELECT s.*, c.name AS customer_name, c.phone, c.address
         FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?`,
      [req.params.id]
    );

    if (!sale.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const [items] = await db.query(
      `SELECT *
         FROM sales_items
        WHERE sale_id = ?
     ORDER BY id ASC`,
      [req.params.id]
    );

    return res.json({ sale: sale[0], items });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    return res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

module.exports = router;

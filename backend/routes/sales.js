// routes/sales.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ----------------- Helper Functions -----------------
const pad = (num, size = 4) => num.toString().padStart(size, "0");
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const r2 = (x) => Number(n(x).toFixed(2));

// Generate invoice number like: INV-YYYYMMDD-0001
async function generateInvoiceNo(connOrPool) {
  const dbi = connOrPool || db;
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const [rows] = await dbi.query(
    "SELECT COUNT(*) AS count FROM sales WHERE DATE(created_at) = CURDATE()"
  );
  const count = rows?.[0]?.count || 0;
  return `INV-${todayStr}-${pad(count + 1)}`;
}

// FIFO Stock Reduction Logic
async function reduceStockFIFO(conn, items) {
  for (const it of items) {
    let remaining = n(it.quantity, 0);
    if (remaining <= 0) continue;

    const [batches] = await conn.query(
      `SELECT id, quantity, sold_qty
         FROM purchase_items
        WHERE medicine_id = ? AND (quantity - sold_qty) > 0
        ORDER BY expiry_date ASC, id ASC`,
      [it.medicine_id]
    );

    for (const b of batches) {
      const available = n(b.quantity) - n(b.sold_qty);
      if (available <= 0) continue;
      const useQty = Math.min(available, remaining);

      await conn.query(
        `UPDATE purchase_items SET sold_qty = sold_qty + ? WHERE id = ?`,
        [useQty, b.id]
      );

      remaining -= useQty;
      if (remaining <= 0) break;
    }
  }
}

// ================================
// ✅ 1️⃣ Create Sale (POST /api/sales)
// ================================
router.post("/", async (req, res) => {
  const {
    customer_id,
    total_amount,
    items,
    bill_type = "Cash",
    payment_mode = "Cash",
    payment_status = "Paid",
    paid_amount = 0,
    round_off = 0,
  } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const invoice_number = await generateInvoiceNo(conn);

    let subtotal = 0,
      discount = 0,
      sgstAmount = 0,
      cgstAmount = 0;

    // Normalize and calculate totals
    const normalizedItems = items.map((it) => {
      const qty = n(it.quantity);
      const rate = n(it.price);
      const discPct = n(it.discount || 0);
      const gstRate = n(it.gst_rate);

      const lineSub = r2(qty * rate);
      const discAmt = r2(lineSub * (discPct / 100));
      const base = r2(lineSub - discAmt);
      const sgst = r2((base * (gstRate / 2)) / 100);
      const cgst = r2((base * (gstRate / 2)) / 100);
      const total = r2(base + sgst + cgst);

      subtotal += lineSub;
      discount += discAmt;
      sgstAmount += sgst;
      cgstAmount += cgst;

      return {
        medicine_id: it.medicine_id,
        product_name: it.name || it.product_name || "",
        batch: it.batch_no || "",
        pack: it.unit || "",
        expiry: it.expiry_date || null,
        hsn: it.hsn || "",
        qty,
        rate,
        mrp: n(it.mrp_price),
        gst_rate: gstRate,
        disc: discPct,
        sgst,
        cgst,
        amount: total,
      };
    });

    const computedTotal = r2(subtotal - discount + sgstAmount + cgstAmount);
    const paid =
      payment_status === "Paid"
        ? computedTotal
        : payment_status === "Unpaid"
        ? 0
        : n(paid_amount);
    const due = r2(computedTotal - paid);

    // Insert Sale record
    const [saleResult] = await conn.query(
      `INSERT INTO sales
       (invoice_number, customer_id, bill_type, payment_mode, payment_status,
        subtotal, discount, sgst, cgst, total, paid_amount, due_amount, round_off)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        customer_id,
        bill_type,
        payment_mode,
        payment_status,
        r2(subtotal),
        r2(discount),
        r2(sgstAmount),
        r2(cgstAmount),
        r2(computedTotal),
        r2(paid),
        r2(due),
        r2(round_off),
      ]
    );

    const saleId = saleResult.insertId;

    // Insert Sale Items
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
          it.batch,
          it.pack,
          it.expiry,
          it.hsn,
          it.qty,
          it.rate,
          it.mrp,
          it.disc,
          r2(it.gst_rate / 2),
          r2(it.gst_rate / 2),
          it.amount,
        ]
      );
    }

    await reduceStockFIFO(conn, normalizedItems);
    await conn.commit();

    res.json({
      success: true,
      message: "✅ Sale saved successfully!",
      saleId,
      invoice_number,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Sale Save Error:", err);
    res.status(500).json({
      error: "Failed to save sale",
      details: err.message,
    });
  } finally {
    conn.release();
  }
});

// ================================
// ✅ 2️⃣ Get All Sales (GET /api/sales) with Filters
// ================================
router.get("/", async (req, res) => {
  try {
    const { q = "", status = "", from = "", to = "", limit } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.invoice_number,
        s.customer_id,
        c.name AS customer_name,
        s.bill_type,
        s.payment_mode,
        s.payment_status,
        s.subtotal,
        s.discount,
        s.sgst,
        s.cgst,
        s.total,
        s.paid_amount,
        s.due_amount,
        s.round_off,
        s.created_at
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // 🔍 Text search
    if (q) {
      sql += " AND (s.invoice_number LIKE ? OR c.name LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    // 💰 Payment status filter
    if (status) {
      sql += " AND s.payment_status = ?";
      params.push(status);
    }

    // 📅 Date range filter
    if (from && to) {
      sql += " AND DATE(s.created_at) BETWEEN ? AND ?";
      params.push(from, to);
    } else if (from) {
      sql += " AND DATE(s.created_at) >= ?";
      params.push(from);
    } else if (to) {
      sql += " AND DATE(s.created_at) <= ?";
      params.push(to);
    }

    sql += " ORDER BY s.id DESC";
    if (limit) sql += " LIMIT " + parseInt(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Fetch sales error:", err);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});


// ================================
// ✅ 3️⃣ Get Single Sale + Items (GET /api/sales/:id)
// ================================
router.get("/:id", async (req, res) => {
  try {
    const [sale] = await db.query(
      `SELECT 
         s.*, 
         c.name AS customer_name, c.phone, c.address
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

    res.json({ sale: sale[0], items });
  } catch (err) {
    console.error("Fetch single sale error:", err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

module.exports = router;

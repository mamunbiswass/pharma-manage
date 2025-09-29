// routes/purchaseBills.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

// Helper functions
const round2 = (n) => Number((Number(n) || 0).toFixed(2));
const num = (v, def = 0) =>
  isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : def;
const today = () => new Date().toISOString().slice(0, 10);

// ===================================================
// ✅ Create New Purchase Bill
// ===================================================
router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      supplier_id,
      invoice_no,
      invoice_date,
      bill_type = "Cash",
      payment_status = "Paid",
      payment_mode = "Cash",
      paid_amount = 0,
      items,
    } = req.body;

    if (!supplier_id || !invoice_no || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        error: "Missing required fields (supplier_id, invoice_no, items[] required)",
      });
    }

    // 🔹 Calculate totals
    let subTotal = 0,
      totalGST = 0,
      totalDiscount = 0;

    const normalizedItems = items.map((it) => {
      const qty = num(it.quantity);
      const rate = num(it.purchase_rate);
      const gstPct = num(it.gst_rate);
      const discPct = num(it.discount);
      const base = round2(qty * rate);
      const gstAmt = round2(base * (gstPct / 100));
      const discAmt = round2(base * (discPct / 100));
      const total = round2(base + gstAmt - discAmt);

      subTotal += base;
      totalGST += gstAmt;
      totalDiscount += discAmt;

      return {
        medicine_id: it.medicine_id || null,
        product_name: it.product_name || it.name || "",
        batch_no: it.batch_no || "",
        expiry_date: it.expiry_date || null,
        quantity: qty,
        free_qty: num(it.free_qty),
        unit: it.unit || "",
        purchase_rate: rate,
        mrp: num(it.mrp),
        gst_rate: gstPct,
        discount: discPct,
        total,
      };
    });

    const grandTotal = round2(subTotal + totalGST - totalDiscount);

    // 🔹 Payment
    let paid = num(paid_amount);
    if (payment_status === "Paid") paid = grandTotal;
    else if (payment_status === "Unpaid") paid = 0;
    const due = round2(grandTotal - paid);

    await conn.beginTransaction();

    // 🔹 Insert into purchase_bills
    const [result] = await conn.query(
      `INSERT INTO purchase_bills
      (supplier_id, invoice_no, invoice_date, bill_type, payment_status, payment_mode,
       paid_amount, due_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier_id,
        String(invoice_no).trim(),
        invoice_date || today(),
        bill_type,
        payment_status,
        payment_mode,
        round2(paid),
        round2(due),
        round2(grandTotal),
      ]
    );

    const billId = result.insertId;

    // 🔹 Insert items
    const itemQuery = `
      INSERT INTO purchase_items
      (purchase_bill_id, medicine_id, product_name, batch_no, expiry_date,
       quantity, free_qty, unit, purchase_rate, mrp, gst_rate, discount, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    for (const it of normalizedItems) {
      await conn.query(itemQuery, [
        billId,
        it.medicine_id,
        it.product_name,
        it.batch_no,
        it.expiry_date,
        it.quantity,
        it.free_qty,
        it.unit,
        it.purchase_rate,
        it.mrp,
        it.gst_rate,
        it.discount,
        it.total,
      ]);
    }

    await conn.commit();

    res.json({
      success: true,
      message: "✅ Purchase bill saved successfully!",
      bill_id: billId,
      totals: {
        subTotal,
        totalGST,
        totalDiscount,
        grandTotal,
        paid,
        due,
      },
      itemsCount: normalizedItems.length,
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Purchase bill save error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  } finally {
    conn.release();
  }
});

// ===================================================
// ✅ Fetch All Purchase Bills
// ===================================================
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, s.name AS supplier_name
      FROM purchase_bills p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id DESC
    `);

    // 🧮 convert decimal strings to numbers
    const normalized = rows.map((r) => ({
      ...r,
      total_amount: Number(r.total_amount ?? 0),
      paid_amount: Number(r.paid_amount ?? 0),
      due_amount: Number(r.due_amount ?? 0),
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Fetch purchase bills error:", err);
    res.status(500).json({ error: "Failed to fetch purchase bills" });
  }
});

// ===================================================
// ✅ Fetch Single Bill + Items
// ===================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid bill id" });

    const [billRows] = await db.query(
      `SELECT p.*, s.name AS supplier_name
       FROM purchase_bills p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    if (!billRows.length)
      return res.status(404).json({ error: "Bill not found" });

    const [items] = await db.query(
      `SELECT * FROM purchase_items WHERE purchase_bill_id = ? ORDER BY id ASC`,
      [id]
    );

    res.json({
      bill: {
        ...billRows[0],
        total_amount: Number(billRows[0].total_amount ?? 0),
        paid_amount: Number(billRows[0].paid_amount ?? 0),
        due_amount: Number(billRows[0].due_amount ?? 0),
      },
      items,
    });
  } catch (err) {
    console.error("Fetch single bill error:", err);
    res.status(500).json({ error: "Failed to fetch bill" });
  }
});

module.exports = router;

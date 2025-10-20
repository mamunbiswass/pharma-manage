// routes/sales.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ----------------------------
// 🧾 1️⃣ Save New Sale (Invoice + Items)
// ----------------------------
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      customer_id,
      date,
      bill_type,
      payment_status,
      payment_mode,
      paid_amount,
      due_amount,
      total_amount,
      items,
    } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: "No items provided" });

    await connection.beginTransaction();

    // 🔹 Generate unique invoice number
    const [last] = await connection.query(
      `SELECT id FROM sales ORDER BY id DESC LIMIT 1`
    );
    const nextNo = (last[0]?.id || 0) + 1;
    const invoiceNumber = `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${String(nextNo).padStart(4, "0")}`;

    // 🔹 Insert into sales table
    const [result] = await connection.query(
      `INSERT INTO sales 
       (invoice_number, customer_id, date, bill_type, payment_status, payment_mode, paid_amount, due_amount, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        invoiceNumber,
        customer_id,
        date,
        bill_type,
        payment_status,
        payment_mode,
        paid_amount,
        due_amount,
        total_amount,
      ]
    );

    const saleId = result.insertId;

    // 🔹 Insert sale items (loop)
    for (const it of items) {
      await connection.query(
        `INSERT INTO sales_items 
         (sale_id, medicine_id, product_name, hsn, batch, expiry_date, unit, qty, rate, mrp, gst, disc, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          it.medicine_id,
          it.product_name,
          it.hsn,
          it.batch_no,
          it.expiry_date || null,
          it.pack || null,
          it.quantity,
          it.price,
          it.mrp_price,
          it.gst_rate,
          it.discount,
          it.quantity * it.price, // base amount (without gst/disc)
        ]
      );

      // 🔹 Update stock (reduce from purchase_items)
      await connection.query(
        `UPDATE purchase_items 
         SET sold_qty = sold_qty + ? 
         WHERE medicine_id = ? AND batch_no = ? LIMIT 1`,
        [it.quantity, it.medicine_id, it.batch_no]
      );
    }

    await connection.commit();
    res.json({ success: true, sale_id: saleId, invoice_number: invoiceNumber });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Sale Save Error:", err);
    res.status(500).json({ error: "Failed to save sale" });
  } finally {
    connection.release();
  }
});


// ----------------------------
// 🧾 2️⃣ Fetch All Sales (List)
// ----------------------------
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.invoice_number, s.date, c.name AS customer_name,
             s.total, s.paid_amount, s.due_amount, s.payment_status
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch sales error:", err);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});


// ----------------------------
// 🧾 3️⃣ Fetch Single Sale (for Invoice)
// ----------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Fetch sale main info
    const [saleData] = await db.query(
      `
      SELECT 
        s.*, 
        c.name AS customer_name, 
        c.phone, 
        c.address
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
      `,
      [id]
    );

    if (!saleData.length)
      return res.status(404).json({ error: "Sale not found" });

    // 🔹 Fetch sale items
    const [items] = await db.query(
      `
      SELECT 
        si.id AS item_id,
        si.medicine_id,
        si.product_name,
        si.batch,
        si.unit,
        DATE_FORMAT(si.expiry_date, "%Y-%m-%d") AS expiry_date,
        si.hsn,
        si.qty,
        si.rate,
        si.mrp,
        si.gst,
        si.disc,
        si.amount
      FROM sales_items si
      WHERE si.sale_id = ?
      `,
      [id]
    );

    res.json({
      sale: saleData[0],
      items,
    });
  } catch (err) {
    console.error("❌ Fetch single sale error:", err);
    res.status(500).json({ error: "Failed to fetch sale invoice" });
  }
});


// ----------------------------
// 🧾 4️⃣ Delete a Sale (optional)
// ----------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Delete sale items first
    await connection.query(`DELETE FROM sales_items WHERE sale_id = ?`, [id]);

    // Then delete sale record
    await connection.query(`DELETE FROM sales WHERE id = ?`, [id]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Sale delete error:", err);
    res.status(500).json({ error: "Failed to delete sale" });
  } finally {
    connection.release();
  }
});

module.exports = router;

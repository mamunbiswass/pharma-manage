// routes/sales.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // db.js এ mysql2/promise connection/pool থাকতে হবে

// =========================
// ADD NEW SALE
// =========================
router.post("/", async (req, res) => {
  const { invoice_number, date, total_amount, customer_name, items } = req.body;

  if (!invoice_number || !date || !items || !items.length) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert sale
    const [saleResult] = await conn.query(
      `INSERT INTO sales (invoice_number, date, total_amount, customer_name) 
       VALUES (?, ?, ?, ?)`,
      [invoice_number, date, total_amount, customer_name]
    );

    const saleId = saleResult.insertId;

    // Insert items + reduce stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO sales_items 
           (sale_id, medicine_id, quantity, price, mrp_price, gst_rate, gst_amount, discount_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.medicine_id,
          item.quantity,
          item.price,
          item.mrp_price,
          item.gst_rate,
          item.gst_amount,
          item.discount_amount || 0,
        ]
      );

      await conn.query(
        `UPDATE medicines SET quantity = quantity - ? WHERE id = ?`,
        [item.quantity, item.medicine_id]
      );
    }

    await conn.commit();
    res.json({ message: "Sale created successfully", saleId });
  } catch (err) {
    await conn.rollback();
    console.error("Sale insert error:", err);
    res.status(500).json({ error: "Failed to create sale", details: err.message });
  } finally {
    conn.release();
  }
});

// =========================
// GET ALL SALES
// =========================
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT id, 
              invoice_number, 
              DATE_FORMAT(date, '%d/%m/%Y') as invoice_date,
              total_amount, 
              customer_name,
              status
       FROM sales
       ORDER BY id DESC`
    );
    res.json(results);
  } catch (err) {
    console.error("Fetch all sales error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// =========================
// GET SINGLE SALE + ITEMS
// =========================
router.get("/:id", async (req, res) => {
  const saleId = req.params.id;

  try {
    const [results] = await db.query(
      `SELECT s.id as sale_id, 
              s.invoice_number, 
              DATE_FORMAT(s.date, '%d/%m/%Y') as invoice_date,
              s.total_amount, 
              s.customer_name,
              si.quantity, si.price, si.mrp_price, 
              si.gst_rate, si.gst_amount, si.discount_amount,
              DATE_FORMAT(m.expiry_date, '%d/%m/%Y') as expiry_date, 
              m.name as medicine_name
       FROM sales s
       JOIN sales_items si ON s.id = si.sale_id
       JOIN medicines m ON si.medicine_id = m.id
       WHERE s.id = ?`,
      [saleId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(results);
  } catch (err) {
    console.error("Fetch sale error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// =========================
// CANCEL SALE
// =========================
router.patch("/:id/cancel", async (req, res) => {
  const saleId = req.params.id;
  try {
    const [result] = await db.query(
      `UPDATE sales SET status = 'cancelled' WHERE id = ?`,
      [saleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({ message: "Sale cancelled successfully" });
  } catch (err) {
    console.error("Cancel sale error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// =========================
// RESTORE SALE
// =========================
router.patch("/:id/restore", async (req, res) => {
  const saleId = req.params.id;
  try {
    const [result] = await db.query(
      `UPDATE sales SET status = 'active' WHERE id = ?`,
      [saleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({ message: "Sale restored successfully" });
  } catch (err) {
    console.error("Restore sale error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

module.exports = router;

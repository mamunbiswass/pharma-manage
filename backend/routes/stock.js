// routes/stock.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================
// ✅ 1️⃣ Fetch All Current Stock
// ===============================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        s.batch_no, 
        s.expiry_date, 
        s.mrp, 
        s.purchase_rate, 
        s.gst_rate, 
        s.available_qty,
        p.pack_size AS pack,
        p.hsn_code AS hsn
      FROM stock s
      LEFT JOIN product_master p ON s.medicine_id = p.id
      WHERE s.medicine_id = ?
      ORDER BY s.id DESC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch stock error:", err);
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

// ===============================
// ✅ 2️⃣ Fetch Batch & Expiry (for Add Sale Page)
// ===============================
router.get("/batches/:medicine_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        id, 
        batch_no, 
        expiry_date, 
        purchase_rate, 
        mrp, 
        gst_rate, 
        (quantity - sold_qty) AS available_qty
      FROM purchase_items
      WHERE medicine_id = ?
      AND (quantity - sold_qty) > 0
      ORDER BY expiry_date ASC
      `,
      [req.params.medicine_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Batch fetch error:", err);
    res.status(500).json({ error: "Failed to fetch batch stock" });
  }
});

// ===============================
// ✅ 3️⃣ Update Stock After Sale
// ===============================
async function updateStockAfterSale(conn, items) {
  for (const it of items) {
    let remaining = Number(it.quantity);

    const [batches] = await conn.query(
      `
      SELECT id, quantity, sold_qty 
      FROM purchase_items 
      WHERE medicine_id = ? AND (quantity - sold_qty) > 0
      ORDER BY expiry_date ASC
      `,
      [it.medicine_id]
    );

    for (const b of batches) {
      const available = b.quantity - b.sold_qty;
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

// 👉 Export both properly
module.exports = router;
module.exports.updateStockAfterSale = updateStockAfterSale;

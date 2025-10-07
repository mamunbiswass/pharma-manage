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
    const medicineId = req.params.medicine_id;

    const [rows] = await db.query(
      `
      SELECT 
        pi.batch_no,
        pi.expiry_date,
        pi.quantity,
        pi.purchase_rate,
        pi.mrp,
        pm.pack_size AS pack,
        pm.hsn_code AS hsn,
        pm.gst_rate
      FROM purchase_items pi
      LEFT JOIN product_master pm ON pm.id = pi.medicine_id
      WHERE pi.medicine_id = ?
      ORDER BY pi.expiry_date ASC
      `,
      [medicineId]
    );

    if (!rows.length)
      return res.json([]);

    // 🧾 Format expiry date
    const formatted = rows.map((r) => ({
      batch_no: r.batch_no,
      expiry_date:
        r.expiry_date && r.expiry_date !== "0000-00-00"
          ? r.expiry_date
          : null,
      quantity: Number(r.quantity) || 0,
      purchase_rate: Number(r.purchase_rate) || 0,
      mrp: Number(r.mrp) || 0,
      pack: r.pack || "-",
      hsn: r.hsn || "-",
      gst_rate: Number(r.gst_rate) || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("🔴 Fetch batch stock error:", err);
    res.status(500).json({ error: "Failed to fetch stock batches" });
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

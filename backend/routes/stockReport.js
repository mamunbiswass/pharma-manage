// routes/stock.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Get All Stock Items
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pm.id AS product_id,
        pm.name AS product_name,
        pm.hsn_code,
        pm.gst_rate,
        IFNULL(SUM(pi.quantity - pi.sold_qty), 0) AS available_qty,
        MIN(pi.batch_no) AS batch_no,
        MIN(pi.expiry_date) AS expiry_date,
        ROUND(AVG(pi.purchase_rate), 2) AS purchase_rate,
        ROUND(AVG(pi.mrp), 2) AS mrp
      FROM product_master pm
      LEFT JOIN purchase_items pi ON pm.id = pi.medicine_id
      GROUP BY pm.id, pm.name, pm.hsn_code, pm.gst_rate
      ORDER BY pm.name ASC
    `);

    const stockList = rows.map((r) => ({
      id: r.product_id,
      name: r.product_name,
      hsn: r.hsn_code || "-",
      gst: r.gst_rate || 0,
      qty: Number(r.available_qty).toFixed(2),
      batch: r.batch_no || "-",
      purchase_rate: r.purchase_rate || 0,
      mrp: r.mrp || 0,
      expiry:
        r.expiry_date && r.expiry_date !== "0000-00-00"
          ? new Date(r.expiry_date).toLocaleDateString("en-GB", {
              month: "2-digit",
              year: "2-digit",
            })
          : "—",
    }));

    res.json(stockList);
  } catch (err) {
    console.error("Stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stock report" });
  }
});

module.exports = router;

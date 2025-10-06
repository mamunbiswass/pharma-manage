// routes/currentStock.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * ✅ Current Stock API
 * This route returns the live stock summary for each product
 * based on purchase_items (purchased - sold).
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pm.id AS product_id,
        pm.name AS product_name,
        pm.hsn_code,
        pm.gst_rate,
        IFNULL(SUM(pi.quantity), 0) AS total_purchased,
        IFNULL(SUM(pi.sold_qty), 0) AS total_sold,
        (IFNULL(SUM(pi.quantity), 0) - IFNULL(SUM(pi.sold_qty), 0)) AS available_qty,
        MIN(pi.batch_no) AS batch_no,
        MIN(pi.expiry_date) AS expiry_date,
        ROUND(AVG(pi.purchase_rate), 2) AS avg_purchase_rate,
        ROUND(AVG(pi.mrp), 2) AS avg_mrp
      FROM product_master pm
      LEFT JOIN purchase_items pi ON pm.id = pi.medicine_id
      GROUP BY pm.id, pm.name, pm.hsn_code, pm.gst_rate
      HAVING available_qty > 0
      ORDER BY pm.name ASC
    `);

    // ✅ Format response
    const stockList = rows.map((r) => ({
      id: r.product_id,
      name: r.product_name,
      hsn: r.hsn_code || "-",
      gst: Number(r.gst_rate || 0),
      total_purchased: Number(r.total_purchased || 0),
      total_sold: Number(r.total_sold || 0),
      qty: Number(r.available_qty || 0),
      batch: r.batch_no || "-",
      purchase_rate: Number(r.avg_purchase_rate || 0).toFixed(2),
      mrp: Number(r.avg_mrp || 0).toFixed(2),
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
    console.error("❌ Current Stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch current stock" });
  }
});

module.exports = router;

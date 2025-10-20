// routes/currentStock.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * ✅ Current Stock API
 * Fetches product-wise stock directly from product_master table
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id AS product_id,
        name AS product_name,
        hsn_code AS hsn,
        gst_rate AS gst,
        stock AS qty,
        purchase_price AS purchase_rate,
        mrp_price AS mrp,
        NULL AS batch,
        NULL AS expiry
      FROM product_master
      ORDER BY name ASC
    `);

    const formatted = rows.map((r) => ({
      id: r.product_id,
      name: r.product_name || "-",
      hsn: r.hsn || "-",
      gst: Number(r.gst || 0),
      qty: Number(r.qty || 0),
      batch: r.batch || "-",
      purchase_rate: Number(r.purchase_rate || 0),
      mrp: Number(r.mrp || 0),
      expiry: r.expiry || "—",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Current Stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch current stock" });
  }
});

module.exports = router;

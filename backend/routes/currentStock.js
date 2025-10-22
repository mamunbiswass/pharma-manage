// routes/currentStock.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/* ======================================
 📦 CURRENT STOCK — PRODUCT MASTER ভিত্তিক
====================================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id AS product_id,
        name AS product_name,
        IFNULL(hsn_code, '-') AS hsn,
        IFNULL(gst_rate, 0) AS gst,
        IFNULL(purchase_price, 0) AS purchase_rate,
        IFNULL(mrp_price, 0) AS mrp,
        IFNULL(stock, 0) AS qty
      FROM product_master
      ORDER BY name ASC
    `);

    const formatted = rows.map((r) => ({
      id: r.product_id,
      name: r.product_name || "-",
      hsn: r.hsn || "-",
      gst: Number(r.gst) || 0,
      qty: Number(r.qty) || 0,
      purchase_rate: Number(r.purchase_rate) || 0,
      mrp: Number(r.mrp) || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Current Stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch current stock" });
  }
});

module.exports = router;

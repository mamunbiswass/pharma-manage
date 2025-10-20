// routes/expiryStock.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pm.id AS product_id,
        pm.name AS product_name,
        pm.hsn_code,
        pi.batch_no,
        pi.expiry_date,
        (pi.quantity - IFNULL(pi.sold_qty,0)) AS available_qty,
        pi.mrp,
        pi.purchase_rate,
        pi.unit
      FROM purchase_items pi
      JOIN product_master pm ON pi.medicine_id = pm.id
      WHERE pi.expiry_date IS NOT NULL
        AND pi.expiry_date <> '0000-00-00'
        AND (pi.quantity - IFNULL(pi.sold_qty,0)) > 0
      ORDER BY pi.expiry_date ASC
    `);

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const data = rows.map(r => ({
      id: r.product_id,
      name: r.product_name,
      hsn: r.hsn_code || "—",
      batch_no: r.batch_no || "—",
      unit: r.unit || "—",
      qty: toNum(r.available_qty),
      mrp: toNum(r.mrp),
      purchase_rate: toNum(r.purchase_rate),
      expiry: r.expiry_date && r.expiry_date !== "0000-00-00"
        ? new Date(r.expiry_date).toLocaleDateString("en-GB", { month: "2-digit", year: "2-digit" })
        : "—",
    }));

    res.json(data);
  } catch (err) {
    console.error("❌ Expiry stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch expiry stock" });
  }
});

module.exports = router;

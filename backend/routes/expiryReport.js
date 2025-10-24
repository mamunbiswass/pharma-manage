const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * ✅ Expiry Report
 * Show ONLY products that are still in stock (pi.quantity > 0)
 * and belong to Expired or Near Expiry category.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          p.id AS product_id,
          p.name AS product_name,
          pi.batch_no,
          pi.expiry_date,
          pi.quantity AS qty,
          pi.mrp,
          pi.purchase_rate,
          p.hsn_code AS hsn,
          p.gst_rate,
          s.name AS supplier_name,
          CASE 
              WHEN pi.expiry_date < CURDATE() THEN 'expired'
              WHEN pi.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'near'
          END AS expiry_status
      FROM purchase_items pi
      LEFT JOIN product_master p ON pi.medicine_id = p.id
      LEFT JOIN purchase_bills pb ON pi.purchase_bill_id = pb.id
      LEFT JOIN suppliers s ON pb.supplier_id = s.id
      WHERE 
          pi.expiry_date IS NOT NULL 
          AND pi.expiry_date <> ''
          AND pi.quantity > 0
          AND (
              pi.expiry_date < CURDATE() 
              OR pi.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          )
      ORDER BY pi.expiry_date ASC;
    `);

    // Separate the results
    const expired = rows.filter((r) => r.expiry_status === "expired");
    const nearExpiry = rows.filter((r) => r.expiry_status === "near");

    res.json({
      expired,
      nearExpiry,
      expiredCount: expired.length,
      nearCount: nearExpiry.length,
    });
  } catch (err) {
    console.error("❌ Expiry Report Error:", err);
    res.status(500).json({ error: "Failed to load expiry report" });
  }
});

module.exports = router;

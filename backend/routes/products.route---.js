const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

// ✅ Add product
router.post("/", async (req, res) => {
  try {
    const {
      name, category_id, manufacturer_id, supplier_id, unit_id,
      pack_size, hsn_code, gst_rate, batch_no,
      purchase_price, sale_price, mrp_price,
      quantity, reorder_level, expiry_date
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO products
        (name, category_id, manufacturer_id, supplier_id, unit_id, pack_size, hsn_code, gst_rate, batch_no,
         purchase_price, sale_price, mrp_price, quantity, reorder_level, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id, manufacturer_id, supplier_id, unit_id, pack_size, hsn_code, gst_rate, batch_no,
       purchase_price, sale_price, mrp_price, quantity, reorder_level, expiry_date]
    );

    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Database error", details: err });
  }
});

// ✅ Get all products with JOIN
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          p.id, p.name,
          c.name AS category,
          mf.name AS manufacturer,
          s.name AS supplier,
          u.name AS unit,
          p.pack_size, p.hsn_code, p.gst_rate, p.batch_no,
          p.purchase_price, p.sale_price, p.mrp_price,
          p.quantity, p.reorder_level,
          DATE_FORMAT(p.expiry_date, '%Y-%m-%d') as expiry_date
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN manufacturers mf ON p.manufacturer_id = mf.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN units u ON p.unit_id = u.id
       ORDER BY p.id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Database error", details: err });
  }
});

module.exports = router;

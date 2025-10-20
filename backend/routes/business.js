const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

// =======================
// Get Latest Business Info
// =======================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM business_info ORDER BY id DESC LIMIT 1"
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error("❌ Fetch business info error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Save or Update Business Info
// =======================
router.post("/", async (req, res) => {
  const { name, address, phone, email, tax_number } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM business_info LIMIT 1");

    if (rows.length > 0) {
      // 🔹 Update existing record
      await db.query(
        `UPDATE business_info 
         SET name=?, address=?, phone=?, email=?, tax_number=?, updated_at=NOW() 
         WHERE id=?`,
        [name, address, phone, email, tax_number, rows[0].id]
      );
      res.json({ message: "✅ Business info updated successfully" });
    } else {
      // 🔹 Insert new record
      await db.query(
        `INSERT INTO business_info (name, address, phone, email, tax_number) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, address, phone, email, tax_number]
      );
      res.json({ message: "✅ Business info saved successfully" });
    }
  } catch (err) {
    console.error("❌ Save business info error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

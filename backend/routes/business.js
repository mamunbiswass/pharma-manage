const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================
// Multer logo storage
// =======================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/logo";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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
    console.error("Fetch business info error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Save or Update Business Info
// =======================
router.post("/", upload.single("logo"), async (req, res) => {
  const { name, address, phone, email, tax_number } = req.body;
  const logo = req.file ? req.file.filename : req.body.logo;

  try {
    const [rows] = await db.query("SELECT * FROM business_info LIMIT 1");

    if (rows.length > 0) {
      // Update existing record
      await db.query(
        `UPDATE business_info 
         SET name=?, address=?, phone=?, email=?, tax_number=?, logo=?, updated_at=NOW() 
         WHERE id=?`,
        [name, address, phone, email, tax_number, logo, rows[0].id]
      );
      res.json({ message: "Business info updated", logo });
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO business_info (name, address, phone, email, tax_number, logo) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, address, phone, email, tax_number, logo]
      );
      res.json({ message: "Business info saved", logo });
    }
  } catch (err) {
    console.error("Save business info error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

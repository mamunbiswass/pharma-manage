const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

// ===================== GET ALL =====================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, phone, email, address, gst_no, drug_license, created_at
       FROM customers ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch customers error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===================== ADD NEW =====================
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address, gst_no, drug_license } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and Phone are required" });
    }

    // Check duplicate (same phone OR gst OR drug_license)
    const [dup] = await db.query(
      `SELECT id FROM customers WHERE phone = ? OR gst_no = ? OR drug_license = ?`,
      [phone, gst_no, drug_license]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: "Duplicate entry not allowed" });
    }

    const [result] = await db.query(
      `INSERT INTO customers (name, phone, email, address, gst_no, drug_license, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, phone, email, address, gst_no?.toUpperCase() || null, drug_license?.toUpperCase() || null]
    );

    res.json({ id: result.insertId, name, phone, email, address, gst_no, drug_license });
  } catch (err) {
    console.error("Insert customer error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===================== UPDATE =====================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, gst_no, drug_license } = req.body;

    // Check duplicate (ignore current row)
    const [dup] = await db.query(
      `SELECT id FROM customers 
       WHERE (phone = ? OR gst_no = ? OR drug_license = ?)
       AND id <> ?`,
      [phone, gst_no, drug_license, id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: "Duplicate entry not allowed" });
    }

    await db.query(
      `UPDATE customers SET 
        name=?, phone=?, email=?, address=?, gst_no=?, drug_license=? 
       WHERE id=?`,
      [name, phone, email, address, gst_no?.toUpperCase() || null, drug_license?.toUpperCase() || null, id]
    );

    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Update customer error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===================== DELETE =====================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM customers WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete customer error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;

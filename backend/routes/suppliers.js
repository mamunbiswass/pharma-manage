const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool connection

// ===============================
// GET all suppliers
// ===============================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM suppliers ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch suppliers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// ADD new supplier
// ===============================
router.post("/", async (req, res) => {
  const { name, phone, email, address, gst, drug_license } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and Phone are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO suppliers (name, phone, email, address, gst, drug_license)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, email, address, gst, drug_license]
    );

    res.json({
      id: result.insertId,
      name,
      phone,
      email,
      address,
      gst,
      drug_license,
    });
  } catch (err) {
    console.error("Add supplier error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// UPDATE supplier
// ===============================
router.put("/:id", async (req, res) => {
  const { name, phone, email, address, gst, drug_license } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE suppliers 
       SET name=?, phone=?, email=?, address=?, gst=?, drug_license=? 
       WHERE id=?`,
      [name, phone, email, address, gst, drug_license, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({ message: "Supplier updated successfully" });
  } catch (err) {
    console.error("Update supplier error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// DELETE supplier
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM suppliers WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error("Delete supplier error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

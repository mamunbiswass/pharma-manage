// routes/returns.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Add Return
router.post("/", async (req, res) => {
  try {
    const { medicineId, quantity, reason } = req.body;

    if (!medicineId || !quantity) {
      return res.status(400).json({ error: "Medicine ID and quantity required" });
    }

    const [result] = await db.query(
      "INSERT INTO returns (medicine_id, quantity, reason, return_date) VALUES (?, ?, ?, NOW())",
      [medicineId, quantity, reason]
    );

    res.json({ message: "Return added successfully", id: result.insertId });
  } catch (err) {
    console.error("Error inserting return:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get all Returns
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT r.id, r.medicine_id, m.name AS medicine_name, r.quantity, r.reason, r.return_date " +
      "FROM returns r JOIN medicines m ON r.medicine_id = m.id ORDER BY r.return_date DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching returns:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

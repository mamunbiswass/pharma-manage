const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Middleware: retailer auth
function retailerAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secret123", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.retailer = decoded;
    next();
  });
}

// ✅ Products list for retailers
router.get("/products", retailerAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, quantity, sale_price AS price FROM medicines"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Retailer products error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

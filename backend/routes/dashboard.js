const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2/promise pool

// Dashboard Stats
router.get("/stats", async (req, res) => {
  try {
    const [[salesToday]] = await db.query(
      `SELECT IFNULL(SUM(total),0) as total_sales
       FROM sales
       WHERE DATE(date) = CURDATE()`
    );

    const [[totalCustomers]] = await db.query(
      `SELECT COUNT(*) as count FROM customers`
    );

    const [[totalProducts]] = await db.query(
      `SELECT COUNT(*) as count FROM products`
    );

    res.json({
      salesToday: salesToday.total_sales,
      customers: totalCustomers.count,
      products: totalProducts.count,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;

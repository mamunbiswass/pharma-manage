// routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/summary", async (req, res) => {
  try {
    // ---- Today's Sale ----
    const [todayRows] = await db.query(`
      SELECT IFNULL(SUM(total), 0) AS todaySale, COUNT(*) AS todayBills
      FROM sales WHERE DATE(created_at) = CURDATE()
    `);

    // ---- Total Customers ----
    const [custRows] = await db.query(`SELECT COUNT(*) AS totalCustomers FROM customers`);

    // ---- Low Stock Medicines (exclude expired) ----
    const [lowStockRows] = await db.query(`
      SELECT 
        pm.id AS product_id,
        pm.name AS product_name,
        pi.batch_no,
        IFNULL(SUM(pi.quantity - pi.sold_qty), 0) AS available_qty,
        pi.expiry_date
      FROM purchase_items pi
      INNER JOIN product_master pm ON pm.id = pi.medicine_id
      WHERE (pi.quantity - pi.sold_qty) > 0
      AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURDATE())
      GROUP BY pm.id, pm.name, pi.batch_no, pi.expiry_date
      HAVING available_qty <= 10
      ORDER BY available_qty ASC, pi.expiry_date ASC
      LIMIT 10
    `);

    // ---- Expiring Soon (within 30 days) ----
    const [expRows] = await db.query(`
      SELECT 
        pm.name AS product_name,
        DATE_FORMAT(pi.expiry_date, '%m/%y') AS formatted_expiry
      FROM purchase_items pi
      JOIN product_master pm ON pm.id = pi.medicine_id
      WHERE pi.expiry_date IS NOT NULL
      AND pi.expiry_date >= CURDATE()
      AND pi.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY pi.expiry_date ASC
      LIMIT 10
    `);

    // ---- Weekly Sales (last 7 days) ----
    const [weeklyRows] = await db.query(`
      SELECT 
        DATE(created_at) AS date,
        IFNULL(SUM(total), 0) AS total
      FROM sales
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    // Format weekly data
    const weeklySales = weeklyRows.map((r) => ({
      day: new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
      total: Number(r.total || 0),
    }));

    // ✅ Final Response
    res.json({
      todaySale: todayRows[0]?.todaySale || 0,
      todayBills: todayRows[0]?.todayBills || 0,
      totalCustomers: custRows[0]?.totalCustomers || 0,
      lowStock: lowStockRows.length,
      expiringSoon: expRows.length,
      lowStockList: lowStockRows.map((r) => ({
        name: r.product_name,
        batch: r.batch_no || "-",
        available_qty: Number(r.available_qty || 0),
        expiry_date:
          r.expiry_date && r.expiry_date !== "0000-00-00"
            ? (() => {
                const d = new Date(r.expiry_date);
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const year = String(d.getFullYear()).slice(-2);
                return `${month}/${year}`; // ✅ MM/YY format
              })()
            : "—",
      })),
      expiringList: expRows.map((r) => ({
        name: r.product_name,
        expiry_date: r.formatted_expiry || "—",
      })),
      weeklySales,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

module.exports = router;

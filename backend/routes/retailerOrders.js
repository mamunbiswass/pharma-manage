const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authRetailer");

// ==========================
// GET products for retailer (Only available stock)
// ==========================
router.get("/products", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, category, quantity, sale_price AS price, mrp_price, expiry_date
       FROM medicines
       WHERE quantity > 0
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Products fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================
// Place Order (Transactional)
// ==========================
router.post("/orders", auth, async (req, res) => {
  const { items, total_amount } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: "No items in order" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into retailer_orders
    const [r] = await conn.query(
      `INSERT INTO retailer_orders 
        (retailer_id, total_amount, status, order_date) 
       VALUES (?, ?, ?, NOW())`,
      [req.retailer.id, total_amount || 0, "Pending"]
    );

    const orderId = r.insertId;

    // Insert order items
    for (const it of items) {
      if (!it.product_id || !it.quantity || !it.price) {
        throw new Error("Invalid item data");
      }

      // ✅ Ensure product exists in medicines table
      const [check] = await conn.query(
        "SELECT id, quantity FROM medicines WHERE id = ?",
        [it.product_id]
      );

      if (check.length === 0) {
        throw new Error(`Medicine not found (ID: ${it.product_id})`);
      }

      if (check[0].quantity < it.quantity) {
        throw new Error(
          `Not enough stock for product ID ${it.product_id}. Available: ${check[0].quantity}`
        );
      }

      // Insert order item
      await conn.query(
        `INSERT INTO retailer_order_items 
          (order_id, product_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, it.product_id, it.quantity, it.price]
      );

      // Reduce stock
      await conn.query(
        "UPDATE medicines SET quantity = quantity - ? WHERE id = ?",
        [it.quantity, it.product_id]
      );
    }

    await conn.commit();
    conn.release();

    res.json({ message: "✅ Order placed successfully", orderId });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("❌ Order Insert Error:", err.sqlMessage || err.message);
    res
      .status(500)
      .json({
        message: "Order failed",
        error: err.sqlMessage || err.message,
      });
  }
});

// ==========================
// Retailer Order History
// ==========================
router.get("/orders", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, DATE_FORMAT(order_date, '%d/%m/%Y %H:%i') AS order_date, status, total_amount
       FROM retailer_orders
       WHERE retailer_id = ?
       ORDER BY id DESC`,
      [req.retailer.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Order history error:", err.sqlMessage || err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

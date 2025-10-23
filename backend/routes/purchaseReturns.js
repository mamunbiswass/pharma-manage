// routes/purchaseReturns.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/* ======================================
 🔁 1️⃣ SAVE PURCHASE RETURN
====================================== */
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { supplier_id, date, reason, items, remarks } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: "No items provided for return" });

    await connection.beginTransaction();

    // 🔹 Insert into returns table
    const [retResult] = await connection.query(
      `INSERT INTO returns 
       (return_type, supplier_id, date, reason, total, remarks, created_at)
       VALUES ('purchase', ?, ?, ?, ?, ?, NOW())`,
      [
        supplier_id || null,
        date,
        reason || "",
        items.reduce((sum, it) => sum + Number(it.amount || 0), 0),
        remarks || "",
      ]
    );

    const returnId = retResult.insertId;

    // 🔹 Insert return items & update stock
    for (const it of items) {
      await connection.query(
        `INSERT INTO return_items 
         (return_id, medicine_id, batch_no, qty, rate, gst, amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          returnId,
          it.medicine_id,
          it.batch_no || "",
          it.qty,
          it.rate,
          it.gst_rate,
          it.amount,
        ]
      );

      // 🔹 Reduce product_master stock
      await connection.query(
        `UPDATE product_master 
         SET stock = GREATEST(stock - ?, 0)
         WHERE id = ?`,
        [it.qty, it.medicine_id]
      );

      // 🔹 Reduce purchase_items quantity
      await connection.query(
        `UPDATE purchase_items 
         SET quantity = GREATEST(quantity - ?, 0)
         WHERE medicine_id = ? AND batch_no = ? 
         LIMIT 1`,
        [it.qty, it.medicine_id, it.batch_no]
      );
    }

    await connection.commit();
    res.json({ success: true, message: "Purchase Return saved successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Purchase Return Save Error:", err);
    res.status(500).json({ error: err.message || "Failed to save purchase return" });
  } finally {
    connection.release();
  }
});

/* ======================================
 🔁 2️⃣ FETCH ALL PURCHASE RETURNS
====================================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.id, 
        r.date, 
        r.total, 
        r.reason, 
        s.name AS supplier_name
      FROM returns r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      WHERE r.return_type = 'purchase'
      ORDER BY r.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Purchase Returns Error:", err);
    res.status(500).json({ error: "Failed to fetch purchase returns" });
  }
});

/* ======================================
 🔁 3️⃣ FETCH SINGLE PURCHASE RETURN DETAILS
====================================== */
router.get("/:id", async (req, res) => {
  try {
    const [header] = await db.query(
      `SELECT r.*, s.name AS supplier_name, s.phone 
       FROM returns r 
       LEFT JOIN suppliers s ON r.supplier_id = s.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!header.length) return res.status(404).json({ error: "Return not found" });

    const [items] = await db.query(
      `SELECT * FROM return_items WHERE return_id = ?`,
      [req.params.id]
    );

    res.json({ return: header[0], items });
  } catch (err) {
    console.error("❌ Fetch Single Purchase Return Error:", err);
    res.status(500).json({ error: "Failed to fetch purchase return" });
  }
});

/* ======================================
 🔁 4️⃣ DELETE PURCHASE RETURN (Revert Stock)
====================================== */
router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT medicine_id, qty, batch_no FROM return_items WHERE return_id = ?`,
      [req.params.id]
    );

    // 🔹 Reverse stock (increase again)
    for (const it of items) {
      await connection.query(
        `UPDATE product_master SET stock = stock + ? WHERE id = ?`,
        [it.qty, it.medicine_id]
      );

      await connection.query(
        `UPDATE purchase_items SET quantity = quantity + ? WHERE medicine_id = ? AND batch_no = ? LIMIT 1`,
        [it.qty, it.medicine_id, it.batch_no]
      );
    }

    await connection.query(`DELETE FROM return_items WHERE return_id = ?`, [req.params.id]);
    await connection.query(`DELETE FROM returns WHERE id = ?`, [req.params.id]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Purchase Return Delete Error:", err);
    res.status(500).json({ error: "Failed to delete purchase return" });
  } finally {
    connection.release();
  }
});

module.exports = router;

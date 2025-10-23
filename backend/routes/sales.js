const express = require("express");
const router = express.Router();
const db = require("../db");
const { updateStockAfterSale } = require("./stock");

/* ======================================
 🧾 1️⃣ SAVE NEW SALE (Invoice + Items)
====================================== */
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      customer_id,
      date,
      bill_type,
      payment_status,
      payment_mode,
      paid_amount,
      due_amount,
      total_amount,
      items,
    } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: "No items provided" });

    // ✅ STEP 1: Stock validation before starting transaction
    for (const it of items) {
      const [stockRows] = await db.query(
        `
        SELECT 
          IFNULL(SUM(pi.quantity - pi.sold_qty), 0) AS available_batch_stock,
          pm.stock AS main_stock
        FROM product_master pm
        LEFT JOIN purchase_items pi ON pm.id = pi.medicine_id
        WHERE pm.id = ?
        `,
        [it.medicine_id]
      );

      const available =
        Number(stockRows[0].available_batch_stock || 0) > 0
          ? Number(stockRows[0].available_batch_stock)
          : Number(stockRows[0].main_stock || 0);

      if (available < it.quantity) {
        return res.status(400).json({
          error: `❌ Not enough stock for "${it.product_name}". Available: ${available}, Requested: ${it.quantity}`,
        });
      }
    }

    // ✅ STEP 2: Begin Transaction
    await connection.beginTransaction();

    // 🔹 Generate unique invoice number
    const [last] = await connection.query(
      `SELECT id FROM sales ORDER BY id DESC LIMIT 1`
    );
    const nextNo = (last[0]?.id || 0) + 1;
    const invoiceNumber = `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${String(nextNo).padStart(4, "0")}`;

    // 🔹 Insert into sales table
    const [result] = await connection.query(
      `INSERT INTO sales 
       (invoice_number, customer_id, date, bill_type, payment_status, payment_mode, paid_amount, due_amount, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        invoiceNumber,
        customer_id,
        date,
        bill_type,
        payment_status,
        payment_mode,
        paid_amount,
        due_amount,
        total_amount,
      ]
    );

    const saleId = result.insertId;

    // 🔹 Insert sale items
    for (const it of items) {
      await connection.query(
        `INSERT INTO sales_items 
         (sale_id, medicine_id, product_name, hsn, batch, expiry_date, unit, qty, rate, mrp, gst, disc, amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          saleId,
          it.medicine_id,
          it.product_name,
          it.hsn || "",
          it.batch_no || "",
          it.expiry_date || null,
          it.unit || "-",
          it.quantity,
          it.price,
          it.mrp_price,
          it.gst_rate,
          it.disc || 0,
          it.quantity * it.price,
        ]
      );
    }

    // ✅ Update stock (batch-wise & main)
    await updateStockAfterSale(connection, items);

    await connection.commit();

    res.json({
      success: true,
      sale_id: saleId,
      invoice_number: invoiceNumber,
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Sale Save Error:", err);
    res.status(500).json({ error: err.message || "Failed to save sale" });
  } finally {
    connection.release();
  }
});

/* ======================================
 🧾 2️⃣ FETCH ALL SALES (List)
====================================== */
router.get("/", async (req, res) => {
  try {
    const { q, status, from, to } = req.query;

    let query = `
      SELECT 
        s.id, 
        s.invoice_number, 
        s.date,
        s.created_at,
        s.bill_type,
        s.payment_mode,
        c.name AS customer_name,
        s.total, 
        s.paid_amount, 
        s.due_amount, 
        s.payment_status
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1
    `;

    const params = [];

    if (q) {
      query += ` AND (s.invoice_number LIKE ? OR c.name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    if (status) {
      query += ` AND s.payment_status = ?`;
      params.push(status);
    }

    if (from && to) {
      query += ` AND DATE(s.date) BETWEEN ? AND ?`;
      params.push(from, to);
    }

    query += ` ORDER BY s.id DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch sales error:", err);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

/* ======================================
 🧾 3️⃣ FETCH SINGLE SALE (Invoice)
====================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [saleData] = await db.query(
      `
      SELECT 
        s.*, 
        c.name AS customer_name, 
        c.phone, 
        c.address
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
      `,
      [id]
    );

    if (!saleData.length)
      return res.status(404).json({ error: "Sale not found" });

    const [items] = await db.query(
      `
      SELECT 
        si.id AS item_id,
        si.medicine_id,
        si.product_name,
        si.batch,
        si.unit,
        DATE_FORMAT(si.expiry_date, "%Y-%m-%d") AS expiry_date,
        si.hsn,
        si.qty,
        si.rate,
        si.mrp,
        si.gst,
        si.disc,
        si.amount
      FROM sales_items si
      WHERE si.sale_id = ?
      `,
      [id]
    );

    res.json({
      sale: saleData[0],
      items,
    });
  } catch (err) {
    console.error("❌ Fetch single sale error:", err);
    res.status(500).json({ error: "Failed to fetch sale invoice" });
  }
});

/* ======================================
 🧾 4️⃣ DELETE SALE (Revert Stock)
====================================== */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT medicine_id, qty FROM sales_items WHERE sale_id = ?`,
      [id]
    );

    for (const it of items) {
      await connection.query(
        `UPDATE product_master SET stock = stock + ? WHERE id = ?`,
        [it.qty, it.medicine_id]
      );
    }

    await connection.query(`DELETE FROM sales_items WHERE sale_id = ?`, [id]);
    await connection.query(`DELETE FROM sales WHERE id = ?`, [id]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Sale delete error:", err);
    res.status(500).json({ error: "Failed to delete sale" });
  } finally {
    connection.release();
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");

/* ======================================
 📦 1️⃣ FETCH CURRENT STOCK SUMMARY
====================================== */
router.get("/current-stock", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pm.id AS medicine_id,
        pm.name,
        pm.hsn_code AS hsn,
        pm.gst_rate AS gst,
        pi.batch_no,
        pi.expiry_date,
        pi.purchase_rate,
        pi.mrp,
        (pi.quantity - pi.sold_qty) AS qty
      FROM purchase_items pi
      LEFT JOIN product_master pm ON pm.id = pi.medicine_id
      WHERE (pi.quantity - pi.sold_qty) > 0
      ORDER BY pm.name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Current stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch current stock" });
  }
});

/* ======================================
 📦 2️⃣ FETCH BATCH LIST FOR MEDICINE (for Add Sale Page)
====================================== */
router.get("/batches/:medicine_id", async (req, res) => {
  const { medicine_id } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        pi.batch_no,
        pi.expiry_date,
        pi.quantity,
        pi.sold_qty,
        pi.purchase_rate,
        pi.mrp,
        pm.pack_size AS pack,
        pm.hsn_code AS hsn,
        pm.gst_rate
      FROM purchase_items pi
      LEFT JOIN product_master pm ON pm.id = pi.medicine_id
      WHERE pi.medicine_id = ? 
      AND (pi.quantity - pi.sold_qty) > 0
      ORDER BY pi.expiry_date ASC
      `,
      [medicine_id]
    );

    if (!rows.length) return res.json([]);

    const formatted = rows.map((r) => ({
      batch_no: r.batch_no,
      expiry_date:
        r.expiry_date && r.expiry_date !== "0000-00-00"
          ? r.expiry_date
          : null,
      available_qty: Number(r.quantity) - Number(r.sold_qty || 0),
      purchase_rate: Number(r.purchase_rate) || 0,
      mrp: Number(r.mrp) || 0,
      pack: r.pack || "-",
      hsn: r.hsn || "-",
      gst_rate: Number(r.gst_rate) || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("🔴 Fetch batch stock error:", err);
    res.status(500).json({ error: "Failed to fetch stock batches" });
  }
});

/* ======================================
 📊 3️⃣ CHECK AVAILABLE STOCK FOR SPECIFIC BATCH
====================================== */
router.get("/check/:medicine_id/:batch_no", async (req, res) => {
  const { medicine_id, batch_no } = req.params;
  console.log("🧩 Checking stock:", { medicine_id, batch_no });

  if (!medicine_id || !batch_no) {
    return res
      .status(400)
      .json({ available: 0, error: "Missing medicine_id or batch_no" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT (quantity - sold_qty) AS available 
      FROM purchase_items 
      WHERE medicine_id = ? 
      AND TRIM(LOWER(batch_no)) = TRIM(LOWER(?))
      LIMIT 1
      `,
      [medicine_id, batch_no]
    );

    console.log("🧩 DB result:", rows);

    if (!rows.length)
      return res.json({ available: 0, message: "Batch not found" });

    res.json({ available: Number(rows[0].available) });
  } catch (err) {
    console.error("❌ Stock check DB error:", err);
    res
      .status(500)
      .json({ available: 0, error: err.message || "Failed to check stock" });
  }
});

/* ======================================
 🔄 4️⃣ UPDATE STOCK AFTER SALE
====================================== */
async function updateStockAfterSale(conn, items) {
  try {
    for (const it of items) {
      let remaining = Number(it.quantity);

      // 🔹 Fetch available batches for this medicine
      const [batches] = await conn.query(
        `
        SELECT id, quantity, sold_qty 
        FROM purchase_items 
        WHERE medicine_id = ? 
        AND (quantity - sold_qty) > 0
        ORDER BY expiry_date ASC
        `,
        [it.medicine_id]
      );

      // 🔹 Deduct sold quantity batch-wise
      for (const b of batches) {
        const available = b.quantity - b.sold_qty;
        const useQty = Math.min(available, remaining);

        await conn.query(
          `UPDATE purchase_items SET sold_qty = sold_qty + ? WHERE id = ?`,
          [useQty, b.id]
        );

        remaining -= useQty;
        if (remaining <= 0) break;
      }
    }
  } catch (err) {
    console.error("❌ updateStockAfterSale error:", err);
    throw err;
  }
}

/* ======================================
 📤 EXPORT ROUTER & FUNCTION
====================================== */
module.exports = router;
module.exports.updateStockAfterSale = updateStockAfterSale;

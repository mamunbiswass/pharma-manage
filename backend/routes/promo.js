// backend/routes/promo.js
const express = require("express");
const router = express.Router();

// Demo promo codes
const promoCodes = {
  DISCOUNT10: { type: "percent", value: 10 }, // 10% off
  FLAT100: { type: "flat", value: 100 },      // ₹100 off
  SAVE50: { type: "flat", value: 50, minOrder: 500 }, // ₹500+ হলে ₹50 off
};

// Apply Promo API
router.post("/apply-promo", (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ message: "Promo code required" });

  const promo = promoCodes[code.toUpperCase()];
  if (!promo) return res.status(400).json({ message: "Invalid promo code" });

  // Minimum order check
  if (promo.minOrder && subtotal < promo.minOrder) {
    return res
      .status(400)
      .json({ message: `Minimum order ₹${promo.minOrder} required` });
  }

  let discount = 0;
  if (promo.type === "percent") {
    discount = (subtotal * promo.value) / 100;
  } else if (promo.type === "flat") {
    discount = promo.value;
  }

  res.json({
    message: `Promo applied successfully!`,
    discount,
  });
});

module.exports = router;

/**
 * 🚀 Pharmacy Management Server — FINAL STABLE BUILD
 * Version: 3.0.0
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// ================================================
// 🧩 MIDDLEWARE SETUP
// ================================================
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static folder for uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================================
// 📦 ROUTE IMPORTS
// ================================================
const loginRoute = require("./routes/login");
const productMasterRoutes = require("./routes/productMaster");
const categoriesRoute = require("./routes/categories");
const manufacturersRoute = require("./routes/manufacturers");
const unitRoutes = require("./routes/units");

const suppliersRoute = require("./routes/suppliers");
const customersRoute = require("./routes/customers");
const purchaseBillsRoute = require("./routes/purchaseBills");
const returnsRoute = require("./routes/returns");
const businessRoute = require("./routes/business");
const invoiceSettingsRoute = require("./routes/invoiceSettings");
const salesRoute = require("./routes/sales");

const stockRoute = require("./routes/stock");
const currentStockRoute = require("./routes/currentStock");
const lowStockRoutes = require("./routes/lowStock");

const dashboardRoute = require("./routes/dashboard");
const promoRoute = require("./routes/promo");

const retailersRoute = require("./routes/retailers");
const retailerProductsRoute = require("./routes/retailerProducts");
const retailerOrdersRoute = require("./routes/retailerOrders");
const adminRetailersRoute = require("./routes/adminRetailers");

// const expiryStockRoutes = require("./routes/expiryStock"); // optional if added later

// ================================================
// 🧾 ROUTE REGISTRATION
// ================================================

// 🔐 Authentication & Admin
app.use("/api", loginRoute);
app.use("/api/admin/retailers", adminRetailersRoute);

// 🏭 Product & Inventory Management
app.use("/api/product_master", productMasterRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/manufacturers", manufacturersRoute);
app.use("/api/units", unitRoutes);
app.use("/api/stock", stockRoute); // handles batch-wise check & stock update
app.use("/api/current-stock", currentStockRoute); // summary stock view
app.use("/api/low-stock", lowStockRoutes);
// app.use("/api/expiry-stock", expiryStockRoutes); // (if implemented later)

// 💳 Purchases, Sales & Transactions
app.use("/api/business", businessRoute);
app.use("/api/purchase-bills", purchaseBillsRoute);
app.use("/api/returns", returnsRoute);
app.use("/api/suppliers", suppliersRoute);
app.use("/api/customers", customersRoute);
app.use("/api/sales", salesRoute);
app.use("/api/invoice-settings", invoiceSettingsRoute);

// 📊 Dashboard Analytics
app.use("/api/dashboard", dashboardRoute);

// 🛍 Retailer Zone
app.use("/api/retailers", retailersRoute);
app.use("/api/retailer/products", retailerProductsRoute);
app.use("/api/retailer/orders", retailerOrdersRoute);

// 🎁 Promotions
app.use("/api/promo", promoRoute);

// ================================================
// 🖼 FILE UPLOAD CONFIGURATION (Logo / Images)
// ================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

// ✅ Upload Route
app.post("/api/upload-logo", upload.single("logo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    success: true,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

// ================================================
// ⚠️ 404 HANDLER
// ================================================
app.use((req, res) => {
  console.warn("❌ Route not found:", req.originalUrl);
  res.status(404).json({ error: "API endpoint not found" });
});

// ================================================
// 🚀 START SERVER
// ================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`✅ Pharmacy Server running on port: ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log("=====================================");
});

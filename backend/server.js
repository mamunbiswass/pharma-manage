/**
 * 🚀 Pharmacy Management Server — FINAL STABLE BUILD
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTE IMPORTS =================
const productMasterRoutes = require("./routes/productMaster");
const loginRoute = require("./routes/login");
const salesRoute = require("./routes/sales");
const categoriesRoute = require("./routes/categories");
const suppliersRoute = require("./routes/suppliers");
const customersRoute = require("./routes/customers");
const businessRoute = require("./routes/business");
const purchaseBillsRoute = require("./routes/purchaseBills");
const returnsRoute = require("./routes/returns");
const retailersRoute = require("./routes/retailers");
const retailerProductsRoute = require("./routes/retailerProducts");
const retailerOrdersRoute = require("./routes/retailerOrders");
const manufacturersRoute = require("./routes/manufacturers");
const unitRoutes = require("./routes/units");
const dashboardRoute = require("./routes/dashboard");
const promoRoute = require("./routes/promo");
const adminRetailersRoute = require("./routes/adminRetailers");
const stockRoute = require("./routes/stock");
const currentStockRoute = require("./routes/currentStock");
const expiryStockRoutes = require("./routes/expiryStock");

// ================= REGISTER ROUTES =================

// 🔐 Auth & Admin
app.use("/api", loginRoute);
app.use("/api/admin/retailers", adminRetailersRoute);

// 🏭 Product & Inventory
app.use("/api/product_master", productMasterRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/manufacturers", manufacturersRoute);
app.use("/api/units", unitRoutes);
app.use("/api/stock", stockRoute);
app.use("/api/current-stock", currentStockRoute);
app.use("/api/expiry-stock", expiryStockRoutes);


// 🧾 Billing & Transactions
app.use("/api/business", businessRoute);
app.use("/api/purchase-bills", purchaseBillsRoute);
app.use("/api/returns", returnsRoute);
app.use("/api/suppliers", suppliersRoute);
app.use("/api/customers", customersRoute);
app.use("/api/sales", salesRoute);

// 📊 Dashboard
app.use("/api/dashboard", dashboardRoute);

// 🛍 Retailer Zone
app.use("/api/retailers", retailersRoute);
app.use("/api/retailer/products", retailerProductsRoute);
app.use("/api/retailer/orders", retailerOrdersRoute);

// 🎁 Promotions
app.use("/api/promo", promoRoute);

// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.post("/api/upload-logo", upload.single("logo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  console.warn("❌ Route not found:", req.originalUrl);
  res.status(404).json({ error: "Route not found" });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running successfully on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
});

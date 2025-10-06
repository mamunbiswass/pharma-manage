import { Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./utils/auth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import AddMedicine from "./pages/AddMedicine";
import AddSale from "./pages/AddSale";
import SalesHistory from "./pages/SalesHistory";
import SaleInvoicePrint from "./pages/SaleInvoicePrint";
import Login from "./pages/Login";
import CategoryManagement from "./pages/CategoryManagement";
import SupplierList from "./pages/SupplierList";
import AddSupplier from "./pages/AddSupplier";
import BusinessInfo from "./pages/BusinessInfo";
import PurchaseBill from "./pages/PurchaseBill";
import PurchaseHistory from "./pages/PurchaseHistory";
import ProfilePage from "./pages/ProfilePage";
import CancelledSales from "./pages/CancelledSales";
import PendingApprovals from "./pages/retailers/PendingApprovals";
import RetailersList from "./pages/retailers/RetailersList";
import LowStockMedicines from "./pages/LowStockMedicines";
import ManufacturerManagement from "./pages/ManufacturerManagement";
import UnitManagement from "./pages/UnitManagement";
import CustomerList from "./pages/CustomerList";
// import InvoicePrint from "./pages/InvoicePrint";
import EditProduct from "./pages/EditMedicine";
import PurchaseInvoicePrint from "./pages/PurchaseInvoicePrint";
import StockReport from "./pages/StockReport";


import RetailerApp from "./retailer/pages/RetailerApp";

// ✅ Protected Route
const PrivateRoute = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Admin Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="product-list" element={<ProductList />} />
        <Route path="add" element={<AddMedicine />} />
        <Route path="sale" element={<AddSale />} />
        <Route path="sales-history" element={<SalesHistory />} />
        <Route path="sale-invoice/:id" element={<SaleInvoicePrint />} />
        <Route path="stock-report" element={<StockReport/>}/>


        {/* <Route path="invoice/:id" element={<ViewInvoice />} /> */}
        
        <Route path="/edit-product/:id" element={<EditProduct />} />

        <Route path="category-management" element={<CategoryManagement />} />
        <Route path="unit-management" element={<UnitManagement />} />
        <Route path="manufacturer-management" element={<ManufacturerManagement />} />
        <Route path="supplierlist" element={<SupplierList />} />
        <Route path="addsupplier" element={<AddSupplier />} />
        <Route path="customer-list" element={<CustomerList />} />
        <Route path="businessinfo" element={<BusinessInfo />} />
        <Route path="purchase-bill" element={<PurchaseBill />} />
        <Route path="purchase-history" element={<PurchaseHistory />} />        
        <Route path="purchase-invoice/:id" element={<PurchaseInvoicePrint />} />
        <Route path="profile-page" element={<ProfilePage />} />
        <Route path="cancelled-sales" element={<CancelledSales />} />
        <Route path="pending-approvals" element={<PendingApprovals />} />
        <Route path="retailers-list" element={<RetailersList />} />
        <Route path="low-stock" element={<LowStockMedicines />} />
        {/* <Route path="/invoice/:id" element={<InvoicePrint />} /> */}
        

      </Route>

      {/* Retailer routes */}
      <Route path="/retailer/*" element={<RetailerApp />} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

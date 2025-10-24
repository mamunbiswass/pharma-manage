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
import CancelledSales from "./pages/CancelledSales";
import LowStockMedicines from "./pages/LowStockMedicines";
import ManufacturerManagement from "./pages/ManufacturerManagement";
import UnitManagement from "./pages/UnitManagement";
import CustomerList from "./pages/CustomerList";
import EditProduct from "./pages/EditMedicine";
import PurchaseInvoicePrint from "./pages/PurchaseInvoicePrint";
import CurrentStock from "./pages/CurrentStock";
import ExpiryReport from "./pages/ExpiryReport";
import LowStock from "./pages/LowStock";
import InvoiceSettings from "./pages/InvoiceSettings"
import SalesReturn from "./pages/SalesReturn";
import PurchaseReturn from "./pages/PurchaseReturn";
import ReturnDashboard from "./pages/ReturnDashboard";


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
        <Route path="current-stock" element={<CurrentStock/>}/>
        <Route path="expiry-report" element={<ExpiryReport/>}/>
        <Route path="low-stock" element={<LowStock/>}/>
        <Route path="/sales-return" element={<SalesReturn />} />
        <Route path="/purchase-return" element={<PurchaseReturn/>}/>
        <Route path="/return-dashboard" element={<ReturnDashboard />} />
        
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
        <Route path="invoice-settings" element={<InvoiceSettings/>}/>
        <Route path="cancelled-sales" element={<CancelledSales />} />
        <Route path="low-stock" element={<LowStockMedicines />} />        
   
        

      </Route>

    </Routes>
  );
}

export default App;

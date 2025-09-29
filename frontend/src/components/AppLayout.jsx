import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaPills,
  FaUsers,
  FaShoppingCart,
  FaFileInvoice,
  FaBoxOpen,
  FaUserCircle,
  FaBell,
  FaCogs,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AppLayout.css";
import API from "../api/axios";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // 🔔 Notification states
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const toggleMenu = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleSignOut = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ✅ Fetch pending retailer notifications
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/admin/retailers/pending");
      setNotifications(res.data);
      setCount(res.data.length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto refresh every 30s (optional)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout d-flex">
      {/* Sidebar */}
      <div
        className={`sidebar position-fixed top-0 start-0 vh-100 p-3 shadow ${
          sidebarOpen ? "open" : ""
        }`}
        style={{ overflowY: "auto" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Inventory</h4>
          <button className="btn btn-light d-lg-none" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        <ul className="nav flex-column mb-auto">
          {/* Dashboard */}
          <li className="nav-item mb-2">
            <NavLink className="btn-toggle align-items-center d-flex" to="/dashboard">
              <FaTachometerAlt className="me-2" /> Dashboard
            </NavLink>
          </li>

          {/* Products */}
          <li className="nav-item mb-2">
            <button
              className="btn btn-toggle align-items-center w-100 d-flex justify-content-between"
              onClick={() => toggleMenu("products")}
            >
              <span>
                <FaPills className="me-2" />
                Products
              </span>
              {activeMenu === "products" ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === "products" && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                
                <li>
                  <NavLink className="nav-link ms-4" to="/add">
                    Add Product
                  </NavLink>
                </li>
                <li>
                  <NavLink className="nav-link ms-4" to="/product-list">
                    Product List
                  </NavLink>
                </li>
                <li>
                  <NavLink className="nav-link ms-4" to="/category-management">
                    Category Management
                  </NavLink>
                   <NavLink className="nav-link ms-4" to="/manufacturer-management">
                    Manufacturer Management
                  </NavLink>
                  <NavLink className="nav-link ms-4" to="/unit-management">
                    Unit Management
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          
          {/* Suppliers */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('suppliers')}>
              <span><FaUsers className="me-2" />Suppliers</span>
              {activeMenu === 'suppliers' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'suppliers' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/supplierlist">Supplier List</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/addsupplier">Add Supplier</NavLink></li>
              </ul>
            )}
          </li>         

          {/* Purchases */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('purchases')}>
              <span><FaShoppingCart className="me-2" />Purchases</span>
              {activeMenu === 'purchases' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'purchases' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/purchase-bill">New Purchase Bill</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/purchase-history">Purchase History</NavLink></li>
              </ul>
            )}
          </li>

          {/* Sales */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('sales')}>
              <span><FaFileInvoice className="me-2" />Sales</span>
              {activeMenu === 'sales' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'sales' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/sale">New Sale</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/sales-list">Sales List</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/cancelled-sales">Cancelled Sales</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/returns">Returns</NavLink></li>
                
              </ul>
            )}
          </li>

          {/* Inventory Reports */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('invreports')}>
              <span><FaBoxOpen className="me-2" />Inventory Reports</span>
              {activeMenu === 'invreports' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'invreports' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/current-stock">Current Stock</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/expiry-report">Expiry Report</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/low-stock">Low Stock Alert</NavLink></li>
              </ul>
            )}
          </li>

          {/* Customers */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('customers')}>
              <span><FaUsers className="me-2" />Customers</span>
              {activeMenu === 'customers' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'customers' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/customer-list">Customer List</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/add-customer">Add Customer</NavLink></li>
              </ul>
            )}
          </li>

          {/* Payments */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('payments')}>
              <span><FaUsers className="me-2" />Payments</span>
              {activeMenu === 'payments' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'payments' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/customer-receipt">Customer Receipts</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/supplier-payments">Supplier Payments</NavLink></li>
              </ul>
            )}
          </li>

          {/* Reports */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('reports')}>
              <span><FaBoxOpen className="me-2" />Reports</span>
              {activeMenu === 'reports' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'reports' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/sales-report">Sales Report</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/purchase-report">Purchase Report</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/gst-summary">GST Summary</NavLink></li>
              </ul>
            )}
          </li>

          {/* Retailers */}
          <li className="nav-item mb-2">
            <button
              className="btn btn-toggle align-items-center w-100 d-flex justify-content-between"
              onClick={() => toggleMenu("retailers")}
            >
              <span>
                <FaUsers className="me-2" />
                Retailers
              </span>
              {activeMenu === "retailers" ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === "retailers" && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li>
                  <NavLink className="nav-link ms-4" to="/retailers-list">
                    Retailers List
                  </NavLink>
                </li>
                <li>
                  <NavLink className="nav-link ms-4" to="/pending-approvals">
                    Pending Approvals
                  </NavLink>
                </li>
                <li>
                  <NavLink className="nav-link ms-4" to="/retailers-orders">
                    Retailer Orders
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Settings */}
          <li className="nav-item mb-2">
            <button className="btn btn-toggle align-items-center w-100 d-flex justify-content-between" onClick={() => toggleMenu('settings')}>
              <span><FaCogs className="me-2" />Settings</span>
              {activeMenu === 'settings' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {activeMenu === 'settings' && (
              <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><NavLink className="nav-link ms-4" to="/businessinfo">Business Info</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/invoice-settings">Invoice Settings</NavLink></li>
                <li><NavLink className="nav-link ms-4" to="/profile-page">Profile</NavLink></li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay d-lg-none" onClick={toggleSidebar}></div>
      )}

      {/* Main content */}
      <div
        className={`main-content flex-grow-1 ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        {/* Top Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom d-flex justify-content-between px-3">
          <div className="d-flex align-items-center">
            <button className="btn btn-primary me-2" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <span className="fw-bold">Inventory Management</span>
          </div>

          <div className="d-flex align-items-center position-relative">
            {/* 🔔 Bell Icon */}
            <div className="dropdown me-3" style={{ position: "relative" }}>
              <button
                className="btn btn-light position-relative"
                onClick={() => setShowBellDropdown(!showBellDropdown)}
              >
                <FaBell size={20} />
                {count > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {count}
                  </span>
                )}
              </button>

              {showBellDropdown && (
                <ul
                  className="dropdown-menu show"
                  style={{
                    right: 0,
                    left: "auto",
                    position: "absolute",
                    marginTop: "0.5rem",
                    minWidth: "300px",
                  }}
                >
                  <li className="dropdown-header">
                    Notifications ({count})
                  </li>

                  {notifications.length === 0 && (
                    <li>
                      <span className="dropdown-item text-muted">
                        No pending approvals
                      </span>
                    </li>
                  )}

                  {notifications.slice(0, 5).map((n) => (
                    <li key={n.id}>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/pending-approvals")}
                      >
                        <strong>{n.name}</strong> requested signup
                        <br />
                        <small className="text-muted">
                          {new Date(n.created_at).toLocaleString()}
                        </small>
                      </button>
                    </li>
                  ))}

                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item fw-bold text-primary"
                      onClick={() => navigate("/pending-approvals")}
                    >
                      View all
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* 👤 User Dropdown */}
            <div className="dropdown" style={{ position: "relative" }}>
              <button className="btn btn-light" onClick={toggleDropdown}>
                <FaUserCircle size={25} />
              </button>
              {showDropdown && (
                <ul
                  className="dropdown-menu show"
                  style={{
                    right: 0,
                    left: "auto",
                    position: "absolute",
                    marginTop: "0.5rem",
                  }}
                >
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;

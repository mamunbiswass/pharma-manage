// frontend/src/retailer/components/Layout.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { Dropdown } from "react-bootstrap";
import "./layout.css";

export default function Layout({ children, cartCount }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className={`retailer-sidebar bg-dark text-white p-3 ${
          collapsed ? "collapsed" : ""
        }`}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">{collapsed ? "RP" : "Retailer Panel"}</h5>
          <button
            className="btn btn-sm btn-outline-light ms-2"
            onClick={() => setCollapsed(!collapsed)}
          >
            <FaBars />
          </button>
        </div>

        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link to="/retailer/products" className="nav-link text-white">
              <i className="bi bi-box"></i> {!collapsed && "Products"}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/retailer/cart" className="nav-link text-white">
              <i className="bi bi-cart"></i>{" "}
              {!collapsed && `Cart (${cartCount})`}
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/retailer/orders" className="nav-link text-white">
              <i className="bi bi-list-check"></i> {!collapsed && "My Orders"}
            </Link>
          </li>
        </ul>
      </div>

      {/* Main content */}
      <div className="main flex-grow-1">
        {/* Fixed Header */}
        <div className="retailer-header bg-light border-bottom d-flex justify-content-between align-items-center px-3">
          {/* Left logo */}
          <div className="d-flex align-items-center">
            <img
              src="/logo192.png"
              alt="Logo"
              style={{ height: "35px", marginRight: "10px" }}
            />
            <h5 className="mb-0 fw-bold">Retailer Dashboard</h5>
          </div>

          {/* Right side */}
          <div className="d-flex align-items-center gap-3">
            <Link to="/retailer/cart" className="btn btn-sm btn-primary">
              <i className="bi bi-cart"></i> Cart ({cartCount})
            </Link>

            <Dropdown align="end">
              <Dropdown.Toggle
                variant="outline-secondary"
                id="dropdown-basic"
                size="sm"
              >
                <i className="bi bi-person-circle"></i> My Account
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/retailer/profile">
                  Profile
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/retailer/settings">
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/retailer/logout">
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Page Content */}
        <div className="content p-3 mt-5">{children}</div>
      </div>
    </div>
  );
}

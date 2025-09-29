// frontend/src/retailer/pages/RetailerDashboard.js
import React from "react";
import { Link } from "react-router-dom";

function RetailerDashboard() {
  return (
    <div className="container mt-5">
      <h2>Retailer Dashboard</h2>
      <p>Welcome Retailer! Here are your options:</p>
      <Link to="/retailer/orders" className="btn btn-success">
        Place Order
      </Link>
    </div>
  );
}

export default RetailerDashboard;

// frontend/src/retailer/components/RetailerPrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function RetailerPrivateRoute({ children }) {
  // localStorage/sessionStorage থেকে token নেওয়া
  const token = localStorage.getItem("retailerToken");

  if (!token) {
    // যদি token না থাকে তাহলে login পেজে পাঠিয়ে দেবে
    return <Navigate to="/retailer/login" replace />;
  }

  // token থাকলে children (protected page) রেন্ডার করবে
  return children;
}

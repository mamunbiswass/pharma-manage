// frontend/src/retailer/pages/RetailerAuth.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../services/api";

export default function RetailerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Toast state
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success"); // success / danger

  // Business info for logo
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/business")
      .then((res) => setBusiness(res.data))
      .catch((err) => console.error(err));
  }, []);

  const triggerToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/retailers/login", {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem("retailerToken", res.data.token);
      navigate("/retailer/products");
    } catch (err) {
      triggerToast("Invalid credentials", "danger");
      console.error(err.response?.data?.message || "Login failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/retailers/register", {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      console.log("✅ Register success:", res.data);
      triggerToast("Registered successfully. Please login.", "success");
      setIsLogin(true);
    } catch (err) {
      console.error("❌ Register error:", err.response?.data || err.message);
      triggerToast(err.response?.data?.message || "Register failed", "danger");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark">
      <div
        className="card shadow-lg p-5 rounded-4 text-light bg-dark"
        style={{ maxWidth: "450px", width: "100%" }}
      >
        {/* Dynamic Logo */}
        <div className="text-center mb-3">
          {business?.logo ? (
            <img
              src={`http://localhost:5000/uploads/logo/${business.logo}`}
              alt="Logo"
              style={{ height: "70px", width: "auto" }}
            />
          ) : (
            <h3 className="text-light">{business?.name || "Your Company"}</h3>
          )}
        </div>

        {/* Heading */}
        <h3 className="text-center mb-4 fw-bold">
          {isLogin ? "Retailer Login" : "Retailer Registration"}
        </h3>

        {isLogin ? (
          // Login Form
          <>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control bg-dark text-light border rounded-3"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-light border rounded-3"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-100 rounded-3 py-2" type="submit">
                Login
              </button>
            </form>

            {/* Switch to Register */}
            <p className="mt-3 text-center">
              Don’t have an account?{" "}
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-primary"
                onClick={() => setIsLogin(false)}
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          // Register Form
          <>
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className="form-control bg-dark text-light border rounded-3"
                  placeholder="Enter your name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control bg-dark text-light border rounded-3"
                  placeholder="Enter your email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  className="form-control bg-dark text-light border rounded-3"
                  placeholder="Enter your phone"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-light border rounded-3"
                  placeholder="Enter your password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-100 rounded-3 py-2" type="submit">
                Register
              </button>
            </form>

            {/* Switch to Login */}
            <p className="mt-3 text-center">
              Already have an account?{" "}
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-primary"
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
            </p>
          </>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div
            className={`toast align-items-center text-white border-0 position-fixed top-0 end-0 m-3 ${
              toastType === "success" ? "bg-success" : "bg-danger"
            } show`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">{toastMsg}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

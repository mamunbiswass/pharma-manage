import axios from "axios";

const API = axios.create({
  baseURL: "https://pharma-backend-3m0i.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Auto attach shop_id & token (if needed)
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.shop_id) {
    config.headers["x-shop-id"] = user.shop_id;
  } else {
    // fallback for now (for testing)
    config.headers["x-shop-id"] = 1;
  }
  return config;
});

export default API;

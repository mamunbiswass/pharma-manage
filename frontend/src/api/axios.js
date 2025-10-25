import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ✅ Interceptor — Automatically add shop_id
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.shop_id) {
    config.headers["x-shop-id"] = user.shop_id;
    console.log("➡️ Sending", config.url, "with shop_id:", user.shop_id);
  } else {
    console.warn("⚠️ No shop_id found in localStorage!");
  }
  return config;
});

export default API;

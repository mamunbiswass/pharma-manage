// frontend/src/retailer/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5000/api',
  // timeout: 5000
});

export default API;

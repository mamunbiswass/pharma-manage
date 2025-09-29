// frontend/src/retailer/pages/RetailerApp.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RetailerProducts from './RetailerProducts';
import RetailerCart from './RetailerCart';
import RetailerOrders from './RetailerOrders';
import RetailerPrivateRoute from '../components/RetailerPrivateRoute';
import RetailerAuth from './RetailerAuth';
import RetailerCheckout from './RetailerCheckout';

export default function RetailerApp() {
  return (
    <Routes>
      {/* ✅ এখন "/retailer/login" এ এই পেজ খুলবে */}
      <Route path="login" element={<RetailerAuth />} />

      <Route
        path="products"
        element={
          <RetailerPrivateRoute>
            <RetailerProducts />
          </RetailerPrivateRoute>
        }
      />
      <Route
        path="cart"
        element={
          <RetailerPrivateRoute>
            <RetailerCart />
          </RetailerPrivateRoute>
        }
      />
      <Route
        path="orders"
        element={
          <RetailerPrivateRoute>
            <RetailerOrders />
          </RetailerPrivateRoute>
        }
      />
      <Route path="checkout" element={<RetailerCheckout />} />
    </Routes>
  );
}

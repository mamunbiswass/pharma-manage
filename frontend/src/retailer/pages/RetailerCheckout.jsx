// frontend/src/retailer/pages/RetailerCheckout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RetailerHeader from "../components/RetailerHeader";
import { Container, Row, Col, Button, Card } from "react-bootstrap";

function authHeaders() {
  const token = localStorage.getItem("retailerToken");
  return { headers: { Authorization: `Bearer ${token}` } };
}

export default function RetailerCheckout() {
  const [cart, setCart] = useState(
    () => JSON.parse(localStorage.getItem("retailer_cart") || "[]")
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (cart.length === 0) navigate("/retailer/cart");
  }, [cart, navigate]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    setLoading(true);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    // ✅ Ensure product_id exists
    const formattedItems = cart.map((i) => ({
      product_id: i.product_id, // ✅ এখন consistent হবে
      quantity: i.quantity,
      price: i.price,
    }));

    try {
      await API.post(
        "/retailer/orders",
        { items: formattedItems, total_amount: total },
        authHeaders()
      );

      localStorage.removeItem("retailer_cart");
      setCart([]);
      navigate("/retailer/orders");
    } catch (err) {
      console.error("❌ Order failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <RetailerHeader onCartUpdate={(updated) => setCart(updated)} />


      <Container className="mt-4">
        <Row>
          <Col md={{ span: 6, offset: 3 }}>
            <Card className="shadow-sm">
              <Card.Header>
                <h5>Order Summary</h5>
              </Card.Header>
              <Card.Body>
                {cart.map((c, idx) => (
                  <div
                    key={idx}
                    className="d-flex justify-content-between mb-2"
                  >
                    <span>
                      {c.name} x {c.quantity}
                    </span>
                    <span>₹{(c.price * c.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <hr />
                <h5>
                  Total: ₹
                  {cart
                    .reduce((s, i) => s + i.price * i.quantity, 0)
                    .toFixed(2)}
                </h5>
                <Button
                  variant="success"
                  className="w-100 mt-3"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? "Placing..." : "Confirm Order"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

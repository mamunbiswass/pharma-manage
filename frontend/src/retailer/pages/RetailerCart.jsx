// frontend/src/retailer/pages/RetailerCart.jsx
import React, { useState } from "react";
import { Container, Table, Button, Form, Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import RetailerHeader from "../components/RetailerHeader";
import API from "../services/api";

export default function RetailerCart() {
  const [cart, setCart] = useState(
    () => JSON.parse(localStorage.getItem("retailer_cart") || "[]")
  );
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState(null); // ✅ inline message state
  const [promoType, setPromoType] = useState("error"); // "success" or "error"
  const navigate = useNavigate();

  // Cart subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = (subtotal - discount).toFixed(2);

  // Save updated cart
  const saveCart = (updated) => {
    setCart(updated);
    localStorage.setItem("retailer_cart", JSON.stringify(updated));
  };

  // Increase quantity
  const increaseQty = (index) => {
    const updated = [...cart];
    updated[index].quantity += 1;
    saveCart(updated);
  };

  // Decrease quantity
  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      saveCart(updated);
    }
  };

  // Remove item
  const removeItem = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCart(updated);
  };

  // Apply promo code
  const applyPromo = async () => {
    if (!promo) {
      setPromoMsg("Please enter a promo code");
      setPromoType("error");
      return;
    }

    try {
      const res = await API.post("/api/promo/apply-promo", {
        code: promo,
        subtotal,
      });
      setDiscount(res.data.discount);
      setPromoMsg(res.data.message || "Promo applied successfully!");
      setPromoType("success");
    } catch (err) {
      setDiscount(0);
      setPromoMsg(err.response?.data?.message || "Invalid promo code");
      setPromoType("error");
    }
  };

  // Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      setPromoMsg("Cart is empty!");
      setPromoType("error");
      return;
    }
    navigate("/retailer/checkout");
  };

  return (
    <>
      <RetailerHeader cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />      


      <Container className="mt-4">
        <h4 className="fw-bold mb-3">🛒 My Cart</h4>

        {cart.length === 0 ? (
          <Card className="p-4 text-center shadow-sm">
            <h5>Your cart is empty</h5>
            <Button
              variant="primary"
              className="mt-3"
              onClick={() => navigate("/retailer/products")}
            >
              Go Shopping
            </Button>
          </Card>
        ) : (
          <Row>
            {/* Left Side: Products */}
            <Col md={8}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Table bordered hover responsive className="align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.name}</td>
                          <td>₹{item.price}</td>
                          <td className="d-flex align-items-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => decreaseQty(idx)}
                              className="me-2"
                            >
                              -
                            </Button>
                            <Form.Control
                              type="text"
                              value={item.quantity}
                              readOnly
                              className="text-center"
                              style={{ width: "60px" }}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => increaseQty(idx)}
                              className="ms-2"
                            >
                              +
                            </Button>
                          </td>
                          <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeItem(idx)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Side: Summary */}
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <strong>₹{subtotal.toFixed(2)}</strong>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Discount:</span>
                    <strong className="text-success">-₹{discount.toFixed(2)}</strong>
                  </div>

                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-bold">Grand Total:</span>
                    <span className="fw-bold text-primary">₹{grandTotal}</span>
                  </div>

                  {/* Promo Code */}
                  <Form className="mb-2 d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Enter Promo Code"
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={applyPromo}
                      className="ms-2"
                    >
                      Apply
                    </Button>
                  </Form>

                  {/* Promo Message */}
                  {promoMsg && (
                    <div
                      className={`small mt-1 ${
                        promoType === "success" ? "text-success" : "text-danger"
                      }`}
                    >
                      {promoMsg}
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Button
                    variant="success"
                    className="w-100 mt-3"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}

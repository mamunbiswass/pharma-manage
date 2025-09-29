import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Navbar,
  Dropdown,
  Badge,
  Button,
  Container,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import noImage from "../assets/no-image.png";

export default function RetailerHeader({
  cart = [],
  cartCount,
  onCartUpdate,
  onSearch,
  onFilter,
}) {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  const updateCart = (newCart) => {
    localStorage.setItem("retailer_cart", JSON.stringify(newCart));
    if (onCartUpdate) onCartUpdate(newCart);
  };

  const incrementQty = (id) => {
    updateCart(
      cart.map((item) =>
        item.product_id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrementQty = (id) => {
    updateCart(
      cart
        .map((item) =>
          item.product_id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    updateCart(cart.filter((item) => item.product_id !== id));
  };

  const goCheckout = () => navigate("/retailer/checkout");

  const handleSearch = (e) => {
    setSearchText(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleFilter = (e) => {
    setCategory(e.target.value);
    if (onFilter) onFilter(e.target.value);
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm py-2 sticky-top">
      <Container fluid>
        <Row className="w-100 align-items-center g-2">
          {/* Logo */}
          <Col xs={12} md={3} className="d-flex align-items-center">
            <Navbar.Brand
              as={Link}
              to="/retailer/products"
              className="d-flex align-items-center"
            >
              <img src="/logo192.png" alt="Logo" style={{ height: "35px" }} />
              <span className="fw-bold ms-2">Retailer Panel</span>
            </Navbar.Brand>
          </Col>

          {/* Search + Filter */}
          <Col xs={12} md={5} className="my-2 my-md-0">
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="🔍 Search products..."
                value={searchText}
                onChange={handleSearch}
              />
              <Form.Select
                value={category}
                onChange={handleFilter}
                style={{ maxWidth: "180px" }}
              >
                <option value="all">All</option>
                <option value="Tablet">Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="Capsule">Capsule</option>
              </Form.Select>
            </div>
          </Col>

          {/* Cart + Profile */}
          <Col xs={12} md={4} className="d-flex justify-content-end gap-3">
            {/* Profile dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" id="profile-dropdown">
                👤 My Account
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/retailer/orders">
                  My Orders
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/retailer/cart">
                  My Cart
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/retailer/profile">
                  Profile
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/retailer/settings">
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => {
                    localStorage.removeItem("retailerToken");
                    navigate("/retailer/login");
                  }}
                >
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Cart Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="primary" id="cart-dropdown">
                🛒 Cart <Badge bg="light" text="dark">{cartCount}</Badge>
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{
                  minWidth: "350px",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
                className="p-2"
              >
                {cart.length === 0 ? (
                  <Dropdown.ItemText>Cart is empty</Dropdown.ItemText>
                ) : (
                  <>
                    {cart.map((item) => {
                      const imageSrc =
                        item.image && item.image.trim() !== ""
                          ? item.image
                          : noImage;
                      return (
                        <div
                          key={item.product_id}
                          className="cart-item d-flex align-items-center border rounded p-2 mb-2 flex-wrap flex-sm-nowrap"
                        >
                          {/* Image */}
                          <img
                            src={imageSrc}
                            alt={item.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "contain",
                            }}
                            className="me-2"
                          />

                          {/* Info */}
                          <div className="flex-grow-1 mt-2 mt-sm-0">
                            <div className="fw-bold small text-truncate">
                              {item.name}
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => decrementQty(item.product_id)}
                              >
                                ➖
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => incrementQty(item.product_id)}
                              >
                                ➕
                              </Button>
                            </div>
                          </div>

                          {/* Price + Remove */}
                          <div className="text-end ms-auto">
                            <div className="fw-bold small">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="mt-1"
                              onClick={() => removeItem(item.product_id)}
                            >
                              ✖
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    <Dropdown.Divider />
                    <div className="px-2 text-end fw-bold">
                      Total: ₹
                      {cart
                        .reduce((s, i) => s + i.price * i.quantity, 0)
                        .toFixed(2)}
                    </div>
                    <div className="sticky-bottom bg-white p-2">
                              
                    {/* ✅ Big button for Cart Page */}
                      <Button
                        variant="warning"
                        className="w-100 btn-sm mb-2"
                        onClick={() => navigate("/retailer/cart")}
                      >
                        🛒 View Cart
                      </Button>
                      <Button
                        variant="success"
                        className="w-100"
                        onClick={goCheckout}
                      >
                        ✅ Proceed to Checkout
                      </Button>
                    </div>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      </Container>
    </Navbar>
  );
}

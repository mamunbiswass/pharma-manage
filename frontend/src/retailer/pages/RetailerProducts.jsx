import React, { useEffect, useState } from "react";
import API from "../services/api";
import RetailerHeader from "../components/RetailerHeader";
import ProductCard from "../components/ProductCard";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function authHeaders() {
  const token = localStorage.getItem("retailerToken");
  return { headers: { Authorization: `Bearer ${token}` } };
}

export default function RetailerProducts() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(
    () => JSON.parse(localStorage.getItem("retailer_cart") || "[]")
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("retailer_cart", JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/retailer/products", authHeaders());
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      if (err.response?.status === 401) navigate("/retailer/login");
    }
  };

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product_id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id, // ✅ সঠিকভাবে save হবে
          name: product.name,
          price: Number(product.price),
          quantity: 1,
        },
      ];
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === "all" || p.category === filter;
    return matchSearch && matchCat;
  });

  return (
    <>
      <RetailerHeader
        cart={cart} // ✅ cart পুরোটা পাঠালাম
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartUpdate={setCart}
        onSearch={setSearch}
        onFilter={setFilter}
      />

      <Container fluid className="mt-4">
        <Row>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <Col md={2} sm={6} xs={6} key={p.id} className="mb-4">
                <ProductCard product={p} onAddToCart={handleAddToCart} />
              </Col>
            ))
          ) : (
            <p className="text-center text-muted">No products found</p>
          )}
        </Row>
      </Container>
    </>
  );
}

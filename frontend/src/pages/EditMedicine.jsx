// frontend/src/pages/EditProduct.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import {
  Container,
  Card,
  Form,
  Row,
  Col,
  Button,
} from "react-bootstrap";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    manufacturer_id: "",
    unit_id: "",
    pack_size: "",
    hsn_code: "",
    gst_rate: "",
    purchase_price: "",
    sale_price: "",
    mrp_price: "",
    stock: "",
  });

  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [units, setUnits] = useState([]);

  // ✅ Load dropdowns and product data
  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, manRes, unitRes, prodRes] = await Promise.all([
          API.get("/categories"),
          API.get("/manufacturers"),
          API.get("/units"),
          API.get(`/product_master/${id}`),
        ]);
        setCategories(catRes.data);
        setManufacturers(manRes.data);
        setUnits(unitRes.data);
        setForm(prodRes.data);
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Failed to load product data");
      }
    }
    fetchData();
  }, [id]);

  // ✅ Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/product_master/${id}`, form);
      alert("✅ Product updated successfully!");
      navigate("/product-list");
    } catch (err) {
      console.error("Update error:", err);
      alert("❌ Failed to update product.");
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-warning text-dark fw-bold">
          ✏️ Edit Product
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>Product Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category_id"
                  value={form.category_id || ""}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Manufacturer</Form.Label>
                <Form.Select
                  name="manufacturer_id"
                  value={form.manufacturer_id || ""}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>Unit</Form.Label>
                <Form.Select
                  name="unit_id"
                  value={form.unit_id || ""}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Pack Size</Form.Label>
                <Form.Control
                  type="text"
                  name="pack_size"
                  value={form.pack_size || ""}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Label>HSN Code</Form.Label>
                <Form.Control
                  type="text"
                  name="hsn_code"
                  value={form.hsn_code || ""}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>GST Rate (%)</Form.Label>
                <Form.Select
                  name="gst_rate"
                  value={form.gst_rate || ""}
                  onChange={handleChange}
                >
                  <option value="">--</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Purchase Price</Form.Label>
                <Form.Control
                  type="number"
                  name="purchase_price"
                  value={form.purchase_price || ""}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Sale Price</Form.Label>
                <Form.Control
                  type="number"
                  name="sale_price"
                  value={form.sale_price || ""}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>MRP Price</Form.Label>
                <Form.Control
                  type="number"
                  name="mrp_price"
                  value={form.mrp_price || ""}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={form.stock || ""}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <div className="text-start mt-3">
              <Button type="submit" size="lg" variant="success">
                💾 Update Product
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="ms-2"
                onClick={() => navigate("/product-list")}
              >
                🔙 Back
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default EditProduct;

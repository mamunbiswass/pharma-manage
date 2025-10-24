import React, { useEffect, useState } from "react";
import API from "../api/axios";
import {
  Container,
  Card,
  Form,
  Row,
  Col,
  Button,
  ListGroup,
} from "react-bootstrap";
import BulkImportProducts from "./BulkImportProducts";

function AddMedicine() {
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

  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [units, setUnits] = useState([]);

  // ✅ Safe Array Parser
  const safeArray = (res, key) => {
    if (!res?.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (key && Array.isArray(res.data[key])) return res.data[key];
    return [];
  };

  // ✅ Load dropdown + product names safely
  useEffect(() => {
    (async () => {
      try {
        const [resProd, resCat, resManu, resUnit] = await Promise.all([
          API.get("/product_master"),
          API.get("/categories"),
          API.get("/manufacturers"),
          API.get("/units"),
        ]);

        const products = safeArray(resProd, "products");
        setAllProducts(products.map((p) => p.name));

        setCategories(safeArray(resCat, "categories"));
        setManufacturers(safeArray(resManu, "manufacturers"));
        setUnits(safeArray(resUnit, "units"));
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    })();
  }, []);

  // ✅ Handle input change + name suggestions
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "name") {
      const filtered = allProducts
        .filter((n) => n.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    }
  };

  // ✅ Select suggestion
  const selectSuggestion = (value) => {
    setForm((prev) => ({ ...prev, name: value }));
    setSuggestions([]);
  };

  // ✅ Submit product
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/product_master", form);
      alert("✅ Product added successfully!");

      // Reset form
      setForm({
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
      setSuggestions([]);
    } catch (err) {
      console.error("Add product error:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "❌ Failed to add product";
      alert(msg);
    }
  };

  return (
    <Container fluid className="mt-4">
      {/* Product Master Form */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">➕ Add Product Master</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit} autoComplete="off">
            <Row className="mb-3">
              <Col md={4} className="position-relative">
                <Form.Label>Product Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                {suggestions.length > 0 && (
                  <ListGroup
                    className="position-absolute w-100"
                    style={{ zIndex: 1000, maxHeight: "150px", overflowY: "auto" }}
                  >
                    {suggestions.map((s, i) => (
                      <ListGroup.Item
                        key={i}
                        action
                        onClick={() => selectSuggestion(s)}
                      >
                        {s}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Col>

              <Col md={4}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label>Manufacturer</Form.Label>
                <Form.Select
                  name="manufacturer_id"
                  value={form.manufacturer_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Manufacturer --</option>
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
                  value={form.unit_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Unit --</option>
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
                  value={form.pack_size}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Label>HSN Code</Form.Label>
                <Form.Control
                  type="text"
                  name="hsn_code"
                  value={form.hsn_code}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>GST Rate (%)</Form.Label>
                <Form.Select
                  name="gst_rate"
                  value={form.gst_rate}
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
                  value={form.purchase_price}
                  onChange={handleChange}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Sale Price</Form.Label>
                <Form.Control
                  type="number"
                  name="sale_price"
                  value={form.sale_price}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>MRP Price</Form.Label>
                <Form.Control
                  type="number"
                  name="mrp_price"
                  value={form.mrp_price}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <div className="text-start mt-3">
              <Button type="submit" size="lg" variant="success">
                ✅ Save Product Master
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* ✅ Bulk Import Section */}
      <BulkImportProducts />
    </Container>
  );
}

export default AddMedicine;

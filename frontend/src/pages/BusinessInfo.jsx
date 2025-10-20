import React, { useEffect, useState } from "react";
import API from "../api/axios";
import {
  Container,
  Card,
  Form,
  Row,
  Col,
  Button,
  Toast,
  ToastContainer,
} from "react-bootstrap";

function BusinessInfo() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    tax_number: "",
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    bg: "success",
  });

  // 🔹 Load Business Info on Page Load
  useEffect(() => {
    API.get("/business")
      .then((res) => {
        if (res.data) setForm(res.data);
      })
      .catch((err) => console.error("❌ Failed to load business info:", err));
  }, []);

  // 🔹 Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔹 Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/business", form);
      showToast("✅ Business Information Saved Successfully!", "success");
    } catch (err) {
      console.error("❌ Error saving business info:", err);
      showToast("❌ Failed to Save Business Information!", "danger");
    }
  };

  // 🔹 Toast Handler
  const showToast = (message, bg = "success") => {
    setToast({ show: true, message, bg });
    setTimeout(() => setToast({ ...toast, show: false }), 3500);
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0 fw-bold">🏢 Business Information</h5>
        </Card.Header>

        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* ===== Business Name ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Business Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your business name"
                required
              />
            </Form.Group>

            {/* ===== Address ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter address"
                rows={2}
              />
            </Form.Group>

            {/* ===== Phone, Email, Tax ===== */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>GST / Tax Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="tax_number"
                    value={form.tax_number}
                    onChange={handleChange}
                    placeholder="Enter GST / Tax Number"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* ===== Save Button ===== */}
            <div className="text-end">
              <Button type="submit" variant="success" size="lg">
                💾 Save Information
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* ===== Toast Notification ===== */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          bg={toast.bg}
          onClose={() => setToast({ ...toast, show: false })}
          delay={3500}
          autohide
        >
          <Toast.Body className="text-white fw-semibold">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}

export default BusinessInfo;

import React, { useState } from "react";
import API from "../api/axios";
import {
  Card,
  Container,
  Row,
  Col,
  Form,
  Button,
  Toast,
} from "react-bootstrap";

function AddSupplier() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gst: "",
    drug_license: "",
  });

  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState(false);

  // Validation function
  const validate = (name, value) => {
    let error = "";
    if (name === "phone") {
      if (!/^\d{10}$/.test(value)) {
        error = "Phone number must be 10 digits";
      }
    }
    if (name === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email address";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validate(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(errors).some((err) => err)) return;

    try {
      await API.post("/suppliers", form);
      setShowToast(true);

      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        gst: "",
        drug_license: "",
      });
      setErrors({});
    } catch (err) {
      console.error(err);
      alert("Failed to add supplier");
    }
  };

  const isFormInvalid = () => {
    return !form.name || !form.phone || Object.values(errors).some((err) => err);
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Add Supplier</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Supplier Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    isInvalid={!!errors.phone}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>GST / Tax ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="gst"
                    value={form.gst}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Drug License</Form.Label>
                  <Form.Control
                    type="text"
                    name="drug_license"
                    value={form.drug_license}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Button type="submit" variant="success" disabled={isFormInvalid()}>
                  Add Supplier
                </Button>
              </Col>
            </Row>

            
          </Form>
        </Card.Body>
      </Card>

      {/* Toast Notification */}
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        className="position-fixed bottom-0 end-0 m-3"
        bg="success"
      >
        <Toast.Header>
          <strong className="me-auto">Success</strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          Supplier Added Successfully!
        </Toast.Body>
      </Toast>
    </Container>
  );
}

export default AddSupplier;

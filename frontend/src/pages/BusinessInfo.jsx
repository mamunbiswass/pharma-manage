import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Container, Card, Form, Row, Col, Button, Image } from "react-bootstrap";

function BusinessInfo() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    tax_number: "",
    logo: ""
  });

  const [file, setFile] = useState(null);

  useEffect(() => {
    API.get("/business")
      .then(res => {
        if (res.data) setForm(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("address", form.address);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      formData.append("tax_number", form.tax_number);
      if (file) formData.append("logo", file);
      else formData.append("logo", form.logo);

      await API.post("/business", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("✅ Business Information Saved!");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving business info");
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">Business Information</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Business Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
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
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tax Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="tax_number"
                    value={form.tax_number}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Upload Logo</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              <div className="mt-2">
                {file ? (
                  <Image src={URL.createObjectURL(file)} alt="Preview Logo" width={120} height={80} thumbnail />
                ) : form.logo ? (
                  <Image
                    src={`http://localhost:5000/uploads/logo/${form.logo}`}
                    alt="Business Logo"
                    height={80}
                    width={120}
                    thumbnail
                  />
                ) : null}
              </div>
            </Form.Group>

            <Button type="submit" variant="success">Save</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default BusinessInfo;

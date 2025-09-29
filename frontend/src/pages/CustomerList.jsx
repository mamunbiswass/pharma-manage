import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import {
  Card,
  Table,
  Button,
  Modal,
  Toast,
  Container,
  Form,
} from "react-bootstrap";

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gst_no: "",
    drug_license: "",
  });
  const [deleteId, setDeleteId] = useState(null);

  // Add Modal state
  const [showAdd, setShowAdd] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      setToastMsg("Failed to fetch customers!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle Form Change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ GST & Drug License Validation Functions
  const isValidGST = (gst) =>
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);

  const isValidDrugLicense = (dl) => /^[A-Z0-9/-]{5,20}$/.test(dl);

  // ✅ Add Customer
  const addCustomer = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setToastMsg("Customer Name is required!");
      setToastType("danger");
      setShowToast(true);
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setToastMsg("Enter a valid 10-digit phone number!");
      setToastType("danger");
      setShowToast(true);
      return;
    }
    if (form.gst_no && !isValidGST(form.gst_no)) {
      setToastMsg("Invalid GST Number format!");
      setToastType("danger");
      setShowToast(true);
      return;
    }
    if (form.drug_license && !isValidDrugLicense(form.drug_license)) {
      setToastMsg("Invalid Drug License format!");
      setToastType("danger");
      setShowToast(true);
      return;
    }

    try {
      await API.post("/customers", form);
      fetchCustomers();
      setToastMsg("Customer Added Successfully!");
      setToastType("success");
      setShowToast(true);
      setShowAdd(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        gst_no: "",
        drug_license: "",
      });
    } catch (err) {
      setToastMsg("Failed to add customer!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  // ✅ Update Customer
  const updateCustomer = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setToastMsg("Customer Name is required!");
      setToastType("danger");
      setShowToast(true);
      return;
    }
    if (form.gst_no && !isValidGST(form.gst_no)) {
      setToastMsg("Invalid GST Number format!");
      setToastType("danger");
      setShowToast(true);
      return;
    }
    if (form.drug_license && !isValidDrugLicense(form.drug_license)) {
      setToastMsg("Invalid Drug License format!");
      setToastType("danger");
      setShowToast(true);
      return;
    }

    try {
      await API.put(`/customers/${editing}`, form);
      setEditing(null);
      fetchCustomers();
      setToastMsg("Customer Updated Successfully!");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      setToastMsg("Failed to update customer!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  // ✅ Delete Customer
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/customers/${deleteId}`);
      setDeleteId(null);
      fetchCustomers();
      setToastMsg("Customer Deleted Successfully!");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      setToastMsg("Failed to delete customer!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Customer List</h4>
          <Button variant="light" size="sm" onClick={() => setShowAdd(true)}>
            <FaPlus /> Add Customer
          </Button>
        </Card.Header>
        <Card.Body>
          <Table bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>GST No</th>
                <th>Drug License</th>
                <th style={{ width: "150px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    {editing === c.id ? (
                      <>
                        <td>
                          <Form.Control
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            name="gst_no"
                            value={form.gst_no}
                            onChange={handleChange}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            name="drug_license"
                            value={form.drug_license}
                            onChange={handleChange}
                          />
                        </td>
                        <td>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={updateCustomer}
                          >
                            Save
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{c.name}</td>
                        <td>{c.phone}</td>
                        <td>{c.email}</td>
                        <td>{c.address}</td>
                        <td>{c.gst_no}</td>
                        <td>{c.drug_license}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => {
                              setEditing(c.id);
                              setForm(c);
                            }}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* ✅ Add Customer Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={addCustomer}>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>GST No</Form.Label>
              <Form.Control
                type="text"
                name="gst_no"
                value={form.gst_no}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Drug License</Form.Label>
              <Form.Control
                type="text"
                name="drug_license"
                value={form.drug_license}
                onChange={handleChange}
              />
            </Form.Group>
            <div className="text-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="ms-2">
                Save
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Toast */}
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        className="position-fixed bottom-0 end-0 m-3"
        bg={toastType}
      >
        <Toast.Header closeButton={false}>
          <strong className="me-auto">
            {toastType === "success" ? "Success" : "Error"}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-white">{toastMsg}</Toast.Body>
      </Toast>
    </Container>
  );
}

export default CustomerList;

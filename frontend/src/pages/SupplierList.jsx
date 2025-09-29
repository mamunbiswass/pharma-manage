import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  Card,
  Table,
  Button,
  Modal,
  Toast,
  Container,
  Form,
} from "react-bootstrap";

function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gst: "",
    drug_license: "",
  });
  const [deleteId, setDeleteId] = useState(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success"); // success | danger

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      setToastMsg("Failed to fetch suppliers!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Delete Supplier
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/suppliers/${deleteId}`);
      setDeleteId(null);
      fetchSuppliers();
      setToastMsg("Supplier Deleted Successfully!");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      setToastMsg("Failed to delete supplier!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  // Start Editing
  const startEdit = (supplier) => {
    setEditing(supplier.id);
    setForm(supplier);
  };

  // Handle Form Change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Update Supplier
  const updateSupplier = async (e) => {
    e.preventDefault();

    // ✅ Validation
    if (!form.name.trim()) {
      setToastMsg("Supplier Name is required!");
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setToastMsg("Enter a valid email address!");
      setToastType("danger");
      setShowToast(true);
      return;
    }

    try {
      await API.put(`/suppliers/${editing}`, form);
      setEditing(null);
      fetchSuppliers();
      setToastMsg("Supplier Updated Successfully!");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      setToastMsg("Failed to update supplier!");
      setToastType("danger");
      setShowToast(true);
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <h4 className="mb-0">Supplier List</h4>
        </Card.Header>
        <Card.Body>
          <Table bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Supplier Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>GST</th>
                <th>Drug License</th>
                <th style={{ width: "150px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length > 0 ? (
                suppliers.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>

                    {editing === s.id ? (
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
                            name="gst"
                            value={form.gst}
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
                            onClick={updateSupplier}
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
                        <td>{s.name}</td>
                        <td>{s.phone}</td>
                        <td>{s.email}</td>
                        <td>{s.address}</td>
                        <td>{s.gst}</td>
                        <td>{s.drug_license}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => startEdit(s)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteId(s.id)}
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
                    No suppliers found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this supplier?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
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

export default SupplierList;

import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Card, Table, Button, Modal, Form, Toast, Container } from "react-bootstrap";

function ManufacturerManagement() {
  const [manufacturers, setManufacturers] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Load manufacturers
  const fetchManufacturers = async () => {
    try {
      const res = await API.get("/manufacturers");
      setManufacturers(res.data);
    } catch {
      showToast("Failed to fetch manufacturers", "danger");
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  // ✅ Validation function
  const validateName = (name) => {
    if (!name.trim()) {
      showToast("Manufacturer name is required", "danger");
      return false;
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      showToast("Manufacturer name must contain only letters", "danger");
      return false;
    }
    return true;
  };

  // ✅ Add
  const addManufacturer = async (e) => {
    e.preventDefault();
    if (!validateName(newName)) return;

    try {
      await API.post("/manufacturers", { name: newName.trim() });
      setNewName("");
      fetchManufacturers();
      showToast("Manufacturer added successfully!");
    } catch (err) {
      if (err.response?.status === 409) {
        showToast("Manufacturer already exists", "danger");
      } else {
        showToast("Failed to add manufacturer", "danger");
      }
    }
  };

  // ✅ Update
  const updateManufacturer = async (id) => {
    if (!validateName(editName)) return;

    try {
      await API.put(`/manufacturers/${id}`, { name: editName.trim() });
      setEditId(null);
      setEditName("");
      fetchManufacturers();
      showToast("Manufacturer updated successfully!");
    } catch (err) {
      if (err.response?.status === 409) {
        showToast("Manufacturer already exists", "danger");
      } else {
        showToast("Failed to update manufacturer", "danger");
      }
    }
  };

  // ✅ Delete
  const deleteManufacturer = async () => {
    try {
      await API.delete(`/manufacturers/${deleteId}`);
      setDeleteId(null);
      fetchManufacturers();
      showToast("Manufacturer deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      showToast("Failed to delete manufacturer", "danger");
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Manufacturer Management</h5>
        </Card.Header>
        <Card.Body>
          {/* Add form */}
          <Form onSubmit={addManufacturer} className="d-flex mb-3">
            <Form.Control
              type="text"
              placeholder="New Manufacturer Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Button type="submit" variant="success" className="ms-2">
              Add
            </Button>
          </Form>

          {/* Table */}
          <Table bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Manufacturer Name</th>
                <th style={{ width: "200px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.length > 0 ? (
                manufacturers.map((m, i) => (
                  <tr key={m.id}>
                    <td>{i + 1}</td>
                    <td>
                      {editId === m.id ? (
                        <Form.Control
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        m.name
                      )}
                    </td>
                    <td>
                      {editId === m.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            className="me-2"
                            onClick={() => updateManufacturer(m.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditId(null);
                              setEditName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="me-2"
                            onClick={() => {
                              setEditId(m.id);
                              setEditName(m.name);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteId(m.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    No manufacturers found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Delete Modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this manufacturer?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteManufacturer}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <Toast
        show={toast.show}
        bg={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "" })}
        className="position-fixed bottom-0 end-0 m-3 text-white"
        delay={3000}
        autohide
      >
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>
    </Container>
  );
}

export default ManufacturerManagement;

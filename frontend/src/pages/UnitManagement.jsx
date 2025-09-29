import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Card, Table, Button, Modal, Form, Toast, Container } from "react-bootstrap";

function UnitManagement() {
  const [units, setUnits] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchUnits = async () => {
    try {
      const res = await API.get("/units");
      setUnits(res.data);
    } catch {
      showToast("Failed to fetch units", "danger");
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const addUnit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/units", { name: newName });
      setNewName("");
      fetchUnits();
      showToast("Unit added successfully!");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add unit", "danger");
    }
  };

  const updateUnit = async (id) => {
    try {
      await API.put(`/units/${id}`, { name: editName });
      setEditId(null);
      setEditName("");
      fetchUnits();
      showToast("Unit updated successfully!");
    } catch {
      showToast("Failed to update unit", "danger");
    }
  };

  const deleteUnit = async () => {
    try {
      await API.delete(`/units/${deleteId}`);
      setDeleteId(null);
      fetchUnits();
      showToast("Unit deleted successfully!");
    } catch {
      showToast("Failed to delete unit", "danger");
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Unit Management</h5>
        </Card.Header>
        <Card.Body>
          {/* Add Unit Form */}
          <Form onSubmit={addUnit} className="d-flex mb-3">
            <Form.Control
              type="text"
              placeholder="New Unit Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Button type="submit" variant="success" className="ms-2">Add</Button>
          </Form>

          {/* Unit Table */}
          <Table bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Unit Name</th>
                <th style={{ width: "200px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {units.length > 0 ? (
                units.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td>
                      {editId === u.id ? (
                        <Form.Control
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        u.name
                      )}
                    </td>
                    <td>
                      {editId === u.id ? (
                        <>
                          <Button size="sm" variant="success" className="me-2" onClick={() => updateUnit(u.id)}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="primary" className="me-2" onClick={() => { setEditId(u.id); setEditName(u.name); }}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteId(u.id)}>Delete</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="text-center">No units found</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Delete Modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete this unit?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={deleteUnit}>Delete</Button>
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

export default UnitManagement;

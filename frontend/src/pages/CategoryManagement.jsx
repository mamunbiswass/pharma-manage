import React, { useEffect, useState } from "react";
import API from "../api/axios";
import {
  Container,
  Card,
  Button,
  Table,
  Form,
  Modal,
  Toast,
} from "react-bootstrap";
import useToast from "../hooks/useToast"; // ✅ Toast hook

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  const [newCatError, setNewCatError] = useState(false);
  const [editCatError, setEditCatError] = useState(false);

  // ✅ Toast hook
  const { toast, showToast, hideToast } = useToast();

  // Load categories
  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
      showToast("Failed to load categories", "danger");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const nameRegex = /^[A-Za-z\s]+$/;

  // Add Category
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (!nameRegex.test(newCategory)) {
      setNewCatError(true);
      showToast("Category name must contain only letters!", "danger");
      return;
    }

    try {
      await API.post("/categories", { name: newCategory });
      setNewCategory("");
      setNewCatError(false);
      fetchCategories();
      showToast("Category added successfully!", "success");
    } catch (err) {
      console.error("Failed to add category", err);
      showToast("Failed to add category", "danger");
    }
  };

  // Edit handling
  const startEdit = (id, name) => {
    setEditingId(id);
    setEditingName(name);
    setEditCatError(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditCatError(false);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;

    if (!nameRegex.test(editingName)) {
      setEditCatError(true);
      showToast("Category name must contain only letters!", "danger");
      return;
    }

    try {
      await API.put(`/categories/${id}`, { name: editingName });
      setEditingId(null);
      setEditingName("");
      setEditCatError(false);
      fetchCategories();
      showToast("Category updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update category", err);
      showToast("Failed to update category", "danger");
    }
  };

  // Delete handling
  const confirmDelete = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/categories/${deleteId}`);
      setShowModal(false);
      setDeleteId(null);
      setDeleteName("");
      fetchCategories();
      showToast("Category deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete category", err);
      showToast("Failed to delete category", "danger");
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h4 className="mb-0">Category Management</h4>
        </Card.Header>
        <Card.Body>
          {/* Add Category Form */}
          <Form onSubmit={addCategory} className="d-flex mb-3">
            <Form.Control
              type="text"
              placeholder="New Category Name"
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                setNewCatError(!nameRegex.test(e.target.value));
              }}
              className={`me-2 ${newCatError ? "is-invalid" : ""}`}
              required
            />
            <Button type="submit" variant="success">
              Add
            </Button>
          </Form>

          {/* Category Table */}
          <Table bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th style={{ width: "10%" }}>#</th>
                <th>Category Name</th>
                <th style={{ width: "30%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((cat, idx) => (
                  <tr key={cat.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {editingId === cat.id ? (
                        <Form.Control
                          type="text"
                          value={editingName}
                          onChange={(e) => {
                            setEditingName(e.target.value);
                            setEditCatError(!nameRegex.test(e.target.value));
                          }}
                          className={editCatError ? "is-invalid" : ""}
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td>
                      {editingId === cat.id ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => saveEdit(cat.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => startEdit(cat.id, cat.name)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => confirmDelete(cat.id, cat.name)}
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
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong className="text-danger">{deleteName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Toast Notification */}
      <Toast
        onClose={hideToast}
        show={toast.show}
        delay={3000}
        autohide
        bg={toast.bg}
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Header>
          <strong className="me-auto">
            {toast.bg === "success" ? "Success" : "Error"}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>
    </Container>
  );
}

export default CategoryManagement;

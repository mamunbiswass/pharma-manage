import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Table,
  InputGroup,
  Spinner,
  Modal,
} from "react-bootstrap";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(100);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Fetch Data (Server-side Pagination)
  const fetchData = async (pageNum = 1, searchVal = "", cat = "", manu = "") => {
    setLoading(true);
    try {
      const res = await API.get("/product_master", {
        params: {
          page: pageNum,
          limit,
          search: searchVal,
          category: cat,
          manufacturer: manu,
        },
      });

      const { data = [], totalPages = 1, categories = [], manufacturers = [] } =
        res.data;

      setProducts(data);
      setTotalPages(totalPages);
      setCategories(categories);
      setManufacturers(manufacturers);
      setPage(pageNum);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Debounce Search + Filter
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData(1, search, categoryFilter, manufacturerFilter);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, categoryFilter, manufacturerFilter]);

  // ✅ Initial Load
  useEffect(() => {
    fetchData(1);
  }, []);

  // ✅ Delete Product
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/product_master/${deleteId}`);
      fetchData(page);
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Failed to delete product");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="align-items-center mb-3">
        <Col>
          <h4 className="fw-bold text-primary">📦 Product Master List</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="primary"
            onClick={() => navigate("/add-product")}
            className="me-2"
          >
            + Add Product
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={4} className="mb-2">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4} className="mb-2">
          <Form.Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4} className="mb-2">
          <Form.Select
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
          >
            <option value="">All Manufacturers</option>
            {manufacturers.map((m, idx) => (
              <option key={idx} value={m}>
                {m}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Table */}
      <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading products...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>HSN</th>
                <th>GST</th>
                <th>Unit</th>
                <th>Pack Size</th>
                <th>Stock</th>
                <th>Purchase</th>
                <th>Sale</th>
                <th>MRP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center text-muted">
                    No records found
                  </td>
                </tr>
              ) : (
                products.map((m, i) => (
                  <tr key={m.id}>
                    <td>{(page - 1) * limit + i + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.category}</td>
                    <td>{m.manufacturer}</td>
                    <td>{m.hsn_code}</td>
                    <td>{m.gst_rate}%</td>
                    <td>{m.unit}</td>
                    <td>{m.pack_size}</td>
                    <td>{m.stock}</td>
                    <td>{parseFloat(m.purchase_price || 0).toFixed(2)}</td>
                    <td>{parseFloat(m.sale_price || 0).toFixed(2)}</td>
                    <td>{parseFloat(m.mrp_price || 0).toFixed(2)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="primary"
                        className="me-2"
                        onClick={() => navigate(`/edit-product/${m.id}`)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <Button
            disabled={page === 1}
            variant="secondary"
            onClick={() => fetchData(page - 1, search, categoryFilter, manufacturerFilter)}
          >
            Prev
          </Button>
          <span className="mx-3 align-self-center">
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            variant="secondary"
            onClick={() => fetchData(page + 1, search, categoryFilter, manufacturerFilter)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this product?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProductList;

// src/pages/PurchaseHistory.jsx
import React, { useEffect, useState } from "react";
import { Card, Table, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import API from "../api/axios";

function PurchaseHistory() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch All Bills
  useEffect(() => {
    async function fetchBills() {
      setLoading(true);
      try {
        const res = await API.get("/purchase-bills");
        if (Array.isArray(res.data)) {
          setBills(res.data);
          setFilteredBills(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch purchase bills:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, []);

  // ✅ Search filter
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = bills.filter(
      (b) =>
        b.supplier_name?.toLowerCase().includes(term) ||
        b.invoice_no?.toLowerCase().includes(term)
    );
    setFilteredBills(filtered);
  }, [search, bills]);

  // ✅ Summary calculations
  const totalBills = filteredBills.length;
  const totalAmount = filteredBills.reduce(
    (sum, b) => sum + Number(b.total_amount || 0),
    0
  );
  const totalPaid = filteredBills.reduce(
    (sum, b) => sum + Number(b.paid_amount || 0),
    0
  );
  const totalDue = filteredBills.reduce(
    (sum, b) => sum + Number(b.due_amount || 0),
    0
  );
  const avgBill = totalBills ? totalAmount / totalBills : 0;

  // ✅ Date format helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;
  };

  return (
    <Card className="mt-4 shadow-lg border-0 rounded-3">
      <Card.Header className="bg-primary text-white py-3">
        <h4 className="fw-bold mb-0">📦 Purchase History</h4>
      </Card.Header>

      <Card.Body>
        {/* ================= Summary Bar ================= */}
        <div className="d-flex flex-wrap justify-content-around text-center mb-4">
          <div className="p-3 bg-light rounded shadow-sm">
            <h6 className="text-muted mb-1">🧾 Total Bills</h6>
            <h5 className="fw-bold">{totalBills}</h5>
          </div>
          <div className="p-3 bg-light rounded shadow-sm">
            <h6 className="text-muted mb-1">💰 Total Purchase</h6>
            <h5 className="fw-bold text-success">
              ₹{totalAmount.toFixed(2)}
            </h5>
          </div>
          <div className="p-3 bg-light rounded shadow-sm">
            <h6 className="text-muted mb-1">✅ Total Paid</h6>
            <h5 className="fw-bold text-primary">
              ₹{totalPaid.toFixed(2)}
            </h5>
          </div>
          <div className="p-3 bg-light rounded shadow-sm">
            <h6 className="text-muted mb-1">⚠️ Total Due</h6>
            <h5 className="fw-bold text-danger">
              ₹{totalDue.toFixed(2)}
            </h5>
          </div>
          <div className="p-3 bg-light rounded shadow-sm">
            <h6 className="text-muted mb-1">📊 Avg Bill</h6>
            <h5 className="fw-bold text-secondary">
              ₹{avgBill.toFixed(2)}
            </h5>
          </div>
        </div>

        {/* ================= Search Box ================= */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Control
              type="text"
              placeholder="🔍 Search by Supplier or Invoice No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
        </Row>

        {/* ================= Table ================= */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" />
            <p>Loading purchase history...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <p className="text-center mt-3 text-muted">No purchase records found.</p>
        ) : (
          <Table bordered hover responsive>
            <thead className="table-dark text-center">
              <tr>
                <th>SN</th>
                <th>Supplier</th>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="text-center align-middle">
              {filteredBills.map((b, i) => (
                <tr key={b.id}>
                  <td>{i + 1}</td>
                  <td>{b.supplier_name}</td>
                  <td>{b.invoice_no}</td>
                  <td>{formatDate(b.invoice_date)}</td>
                  <td>₹{Number(b.total_amount || 0).toFixed(2)}</td>
                  <td>₹{Number(b.paid_amount || 0).toFixed(2)}</td>
                  <td>₹{Number(b.due_amount || 0).toFixed(2)}</td>
                  <td>{b.payment_mode}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.payment_status === "Paid"
                          ? "bg-success"
                          : b.payment_status === "Partial"
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                    >
                      {b.payment_status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/purchase-invoice/${b.id}`}>
                      <Button size="sm" variant="outline-primary">
                        📄 View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

export default PurchaseHistory;

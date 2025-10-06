import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Table, Button, Card, Badge, Spinner, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch sales with filters
  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (statusFilter) params.append("status", statusFilter);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await API.get(`/sales?${params.toString()}`);
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}-${(
      d.getMonth() + 1
    ).toString().padStart(2, "0")}-${d.getFullYear()}`;
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    fetchSales();
  };

  // ✅ Summary Totals
  const totalPaid = sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
  const totalDue = sales.reduce((sum, s) => sum + Number(s.due_amount || 0), 0);
  const totalSales = sales.reduce((sum, s) => sum + Number(s.total || s.total_amount || 0), 0);

  return (
    <Card className="mt-4 shadow-sm border-0">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0">🧾 Sales History</h4>
        <div>
          <Button variant="light" size="sm" onClick={clearFilters} className="me-2">
            ❌ Clear
          </Button>
          <Button variant="success" size="sm" onClick={fetchSales}>
            🔄 Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* 🔍 Filters */}
        <Form onSubmit={handleFilter} className="mb-4">
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label>Search (Invoice / Customer)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type to search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Label>Payment Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Button type="submit" variant="primary" className="w-100">
                🔍 Apply Filters
              </Button>
            </Col>
          </Row>
        </Form>

        {/* 🧾 Table */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-5">
            <p className="fw-semibold text-muted">No sales found</p>
          </div>
        ) : (
          <>
            <Table bordered hover responsive className="align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Bill Type</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td>{s.invoice_number}</td>
                    <td>{s.customer_name || "N/A"}</td>
                    <td>{s.bill_type || "-"}</td>
                    <td>{s.payment_mode || "-"}</td>
                    <td>
                      {s.payment_status === "Paid" ? (
                        <Badge bg="success">Paid</Badge>
                      ) : s.payment_status === "Partial" ? (
                        <Badge bg="warning">Partial</Badge>
                      ) : (
                        <Badge bg="danger">Unpaid</Badge>
                      )}
                    </td>
                    <td>₹{Number(s.paid_amount || 0).toFixed(2)}</td>
                    <td>₹{Number(s.due_amount || 0).toFixed(2)}</td>
                    <td className="fw-bold text-success">
                      ₹{Number(s.total_amount || s.total || 0).toFixed(2)}
                    </td>
                    <td>{formatDate(s.created_at)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => navigate(`/sale-invoice/${s.id}`)}
                      >
                        🖨 View / Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* 🔢 Summary Totals */}
            <div className="text-end mt-3 border-top pt-3">
              <p>
                <strong>Total Paid:</strong> ₹{totalPaid.toFixed(2)} &nbsp;|&nbsp;
                <strong>Total Due:</strong> ₹{totalDue.toFixed(2)} &nbsp;|&nbsp;
                <strong>Total Sales:</strong> ₹{totalSales.toFixed(2)}
              </p>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default SalesHistory;

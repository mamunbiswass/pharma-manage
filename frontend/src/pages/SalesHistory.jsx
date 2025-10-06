import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Table, Button, Card, Badge, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await API.get("/sales");
        setSales(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch sales:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}-${(
      d.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  };

  return (
    <Card className="mt-4 shadow-sm border-0">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0">🧾 Sales History</h4>
        <Button variant="light" size="sm" onClick={() => window.location.reload()}>
          🔄 Refresh
        </Button>
      </Card.Header>
      <Card.Body>
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
        )}
      </Card.Body>
    </Card>
  );
}

export default SalesHistory;

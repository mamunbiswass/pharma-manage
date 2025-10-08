import React, { useEffect, useState } from "react";
import { Card, Table, Badge, Spinner, Form, Row, Col, Button } from "react-bootstrap";
import API from "../api/axios";

function ExpiryStock() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
const asNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (v) => asNum(v).toFixed(2);

useEffect(() => {
  (async () => {
    try {
      const res = await API.get("/expiry-stock");
      const list = Array.isArray(res.data) ? res.data : [];
      setStocks(list.map(s => ({
        ...s,
        qty: asNum(s.qty),
        mrp: asNum(s.mrp),
        purchase_rate: asNum(s.purchase_rate),
      })));
    } catch (e) {
      console.error("Failed to load expiry stock:", e);
      setStocks([]);
    }
  })();
}, []);


  const filteredStocks = stocks.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="mt-4 shadow border-0">
      <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0">🧯 Expiring / Expired Medicines</h4>
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="🔍 Search Medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "220px" }}
          />
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </Form.Select>
          <Button variant="light" onClick={() => window.location.reload()}>
            🔄 Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-2">Loading expiry stock...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-5 text-muted fw-semibold">
            No expiring or expired medicines found!
          </div>
        ) : (
          <Table bordered hover responsive className="align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Batch</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>MRP</th>
                <th>GST%</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((s, i) => (
                <tr
                  key={i}
                  className={
                    s.status === "Expired"
                      ? "table-danger"
                      : s.status === "Expiring Soon"
                      ? "table-warning"
                      : ""
                  }
                >
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.batch_no}</td>
                  <td>{s.hsn}</td>
                  <td>{s.qty}</td>
                  <td className="text-end">₹{money(s.purchase_rate)}</td>
                  <td className="text-end">₹{money(s.mrp)}</td>
                  <td>{s.gst}%</td>
                  <td>{s.expiry}</td>
                  <td>
                    <Badge
                      bg={
                        s.status === "Expired"
                          ? "danger"
                          : s.status === "Expiring Soon"
                          ? "warning"
                          : "success"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td>{s.days_left > 0 ? s.days_left + " days" : "Expired"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

export default ExpiryStock;

import React, { useEffect, useState } from "react";
import { Table, Container, Card, Spinner, Form } from "react-bootstrap";
import API from "../api/axios";

function StockReport() {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await API.get("/stock");
        setStocks(res.data || []);
      } catch (err) {
        console.error("Stock load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStock();
  }, []);

  const filtered = stocks.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading Stock Report...</p>
      </div>
    );

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📦 Stock Report</h5>
          <Form.Control
            type="text"
            placeholder="🔍 Search medicine..."
            style={{ width: "250px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-success text-center">
              <tr>
                <th>#</th>
                <th>Medicine Name</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Purchase Rate</th>
                <th>MRP</th>
                <th>HSN</th>
                <th>GST%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((s, i) => (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td>{s.name}</td>
                    <td className="text-center">{s.batch}</td>
                    <td className="text-center">{s.expiry}</td>
                    <td
                      className={`text-center ${
                        s.qty <= 5 ? "text-danger fw-bold" : ""
                      }`}
                    >
                      {s.qty}
                    </td>
                    <td className="text-end">₹{s.purchase_rate.toFixed(2)}</td>
                    <td className="text-end">₹{s.mrp.toFixed(2)}</td>
                    <td className="text-center">{s.hsn}</td>
                    <td className="text-center">{s.gst}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-3">
                    😴 No stock data available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default StockReport;

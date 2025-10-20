import React, { useEffect, useState } from "react";
import { Card, Table, Spinner, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { Download } from "lucide-react";
import API from "../api/axios";

function LowStock() {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);

  // ✅ Fetch low stock
  useEffect(() => {
    async function fetchLowStock() {
      try {
        const res = await API.get("/low-stock");
        setStock(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch low stock:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLowStock();
  }, []);

  // 🔍 Filter Logic
  const filtered = stock.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCritical = criticalOnly ? s.stock <= 5 : true;
    return matchSearch && matchCritical;
  });

  // 📊 Summary
  const totalProducts = filtered.length;
  const totalStock = filtered.reduce((sum, s) => sum + s.stock, 0);
  const totalValue = filtered.reduce(
    (sum, s) => sum + s.stock * s.purchase_rate,
    0
  );

  // 📥 Export CSV
  const exportCSV = () => {
    const csv = [
      ["Medicine", "Batch", "Stock", "Purchase Rate", "MRP", "Expiry"],
      ...filtered.map((s) => [
        s.name,
        s.batch || "-",
        s.stock,
        s.purchase_rate,
        s.mrp,
        s.expiry,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Low_Stock_Report.csv";
    link.click();
  };

  return (
    <div className="container mt-4">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">⚠️ Low Stock Medicines</h4>
          <div>
            <Button variant="light" size="sm" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Form className="mb-3">
            <Row className="g-3">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Search medicine..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="switch"
                  label="Show Critical (≤ 5)"
                  checked={criticalOnly}
                  onChange={(e) => setCriticalOnly(e.target.checked)}
                />
              </Col>
              <Col md={5} className="text-end">
                <Badge bg="info">Total Products: {totalProducts}</Badge>{" "}
                <Badge bg="success">Total Qty: {totalStock}</Badge>{" "}
                <Badge bg="warning" text="dark">
                  Value: ₹{totalValue.toFixed(2)}
                </Badge>
              </Col>
            </Row>
          </Form>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p>Loading low stock...</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted fw-semibold py-4">
              ✅ No low-stock medicines found
            </p>
          ) : (
            <Table bordered hover responsive className="align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>HSN</th>
                  <th>GST%</th>
                  <th>Stock</th>
                  <th>Purchase Rate</th>
                  <th>MRP</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="text-start">{m.name}</td>
                    <td>{m.hsn}</td>
                    <td>{m.gst}</td>
                    <td
                      className={
                        m.stock <= 5
                          ? "text-danger fw-bold"
                          : m.stock <= 10
                          ? "text-warning fw-semibold"
                          : ""
                      }
                    >
                      {m.stock}
                    </td>
                    <td>₹{m.purchase_rate.toFixed(2)}</td>
                    <td>₹{m.mrp.toFixed(2)}</td>
                    <td>{m.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default LowStock;

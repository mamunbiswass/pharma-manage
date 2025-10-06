import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Table, Card, Spinner, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { Download } from "lucide-react";

function CurrentStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);

  // ✅ Fetch Stock Data
  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await API.get("/current-stock");
      const data = Array.isArray(res.data) ? res.data : [];
      setStock(data);
    } catch (err) {
      console.error("Failed to fetch stock:", err);
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // 🔍 Filter Logic
  const filteredStock = stock.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = filterLow ? item.qty <= 10 : true;
    return matchesSearch && matchesLowStock;
  });

  // 📦 Summary Totals
  const totalProducts = filteredStock.length;
  const totalQty = filteredStock.reduce((sum, s) => sum + Number(s.qty || 0), 0);
  const totalPurchaseValue = filteredStock.reduce(
    (sum, s) => sum + Number(s.purchase_rate || 0) * Number(s.qty || 0),
    0
  );
  const totalMRPValue = filteredStock.reduce(
    (sum, s) => sum + Number(s.mrp || 0) * Number(s.qty || 0),
    0
  );

  // 📥 Export CSV
  const exportCSV = () => {
    const csvContent = [
      ["Product", "HSN", "GST%", "Batch", "Qty", "Purchase Rate", "MRP", "Expiry"],
      ...filteredStock.map((s) => [
        s.name,
        s.hsn,
        s.gst,
        s.batch,
        s.qty,
        s.purchase_rate,
        s.mrp,
        s.expiry,
      ]),
      [],
      ["Summary", "", "", "", "", "", "", ""],
      ["Total Products", totalProducts],
      ["Total Quantity", totalQty],
      ["Total Purchase Value", totalPurchaseValue.toFixed(2)],
      ["Total MRP Value", totalMRPValue.toFixed(2)],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Current_Stock_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <Card className="mt-4 shadow-sm border-0">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0">📦 Current Stock</h4>
        <div>
          <Button variant="light" size="sm" onClick={fetchStock} className="me-2">
            🔄 Refresh
          </Button>
          <Button variant="success" size="sm" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* 🔍 Filters */}
        <Form className="mb-4">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Search Product</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type medicine name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Check
                type="switch"
                id="low-stock-toggle"
                label="Show Low Stock (≤ 10)"
                checked={filterLow}
                onChange={(e) => setFilterLow(e.target.checked)}
              />
            </Col>
            <Col md={4}>
              <p className="fw-semibold text-secondary mt-3">
                Total Products: <Badge bg="info">{totalProducts}</Badge> | Total Qty:{" "}
                <Badge bg="success">{totalQty}</Badge>
              </p>
            </Col>
          </Row>
        </Form>

        {/* 📊 Table */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading stock...</p>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-5 text-muted fw-semibold">
            No stock records found
          </div>
        ) : (
          <>
            <Table bordered hover responsive className="align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>HSN</th>
                  <th>GST%</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Purchase Rate</th>
                  <th>MRP</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>{i + 1}</td>
                    <td className="text-start">{s.name}</td>
                    <td>{s.hsn}</td>
                    <td>{s.gst}</td>
                    <td>{s.batch}</td>
                    <td className={s.qty <= 10 ? "text-danger fw-bold" : ""}>{s.qty}</td>
                    <td>₹{Number(s.purchase_rate || 0).toFixed(2)}</td>
                    <td>₹{Number(s.mrp || 0).toFixed(2)}</td>
                    <td>{s.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* 📊 Valuation Summary */}
            <div className="text-end mt-3 border-top pt-3">
              <h6 className="fw-bold text-secondary">
                Total Purchase Value:{" "}
                <span className="text-primary">₹{totalPurchaseValue.toFixed(2)}</span> &nbsp;|&nbsp;
                Total MRP Value:{" "}
                <span className="text-success">₹{totalMRPValue.toFixed(2)}</span>
              </h6>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default CurrentStock;

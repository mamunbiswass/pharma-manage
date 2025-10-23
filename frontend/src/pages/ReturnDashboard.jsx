import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Card, Table, Button, Spinner, Form, Row, Col, Badge } from "react-bootstrap";
import { Download, RefreshCw } from "lucide-react";

// ✅ Format date-time in Indian style (DD-MM-YYYY, hh:mm A)
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};


function ReturnDashboard() {
  const [salesReturns, setSalesReturns] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sales");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ✅ Fetch Returns
  const fetchReturns = async () => {
    setLoading(true);
    try {
      const [salesRes, purchaseRes] = await Promise.all([
        API.get("/returns"),
        API.get("/purchase-returns"),
      ]);
      setSalesReturns(Array.isArray(salesRes.data) ? salesRes.data : []);
      setPurchaseReturns(Array.isArray(purchaseRes.data) ? purchaseRes.data : []);
    } catch (err) {
      console.error("❌ Failed to load returns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // 🔍 Filter logic
  const filterData = (data) => {
    return data.filter((r) => {
      const matchesSearch =
        r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(r.id).includes(search);
      const matchesDate =
        (!from || new Date(r.date) >= new Date(from)) &&
        (!to || new Date(r.date) <= new Date(to));
      return matchesSearch && matchesDate;
    });
  };

  const filteredSales = filterData(salesReturns);
  const filteredPurchase = filterData(purchaseReturns);

  // 📥 Export CSV
  const exportCSV = (type, data) => {
    const headers =
      type === "sales"
        ? ["Return ID", "Date", "Customer", "Reason", "Total"]
        : ["Return ID", "Date", "Supplier", "Reason", "Total"];

    const csv = [
      headers.join(","),
      ...data.map((r) =>
        [
          r.id,
          r.date,
          r.customer_name || r.supplier_name,
          r.reason || "-",
          r.total,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}_returns_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const totalSales = filteredSales.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalPurchase = filteredPurchase.reduce((s, r) => s + Number(r.total || 0), 0);

  return (
    <Card className="mt-4 shadow-sm border-0">
      <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0">🔁 Return Dashboard</h4>
        <div>
          <Button variant="light" size="sm" onClick={fetchReturns} className="me-2">
            <RefreshCw size={16} className="me-1" /> Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* 🔍 Filters */}
        <Form className="mb-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </Col>
          </Row>
        </Form>

        {/* 🧭 Tabs */}
        <div className="mb-3">
          <Button
            variant={activeTab === "sales" ? "primary" : "outline-primary"}
            className="me-2"
            onClick={() => setActiveTab("sales")}
          >
            🧾 Sales Return
          </Button>
          <Button
            variant={activeTab === "purchase" ? "warning" : "outline-warning"}
            onClick={() => setActiveTab("purchase")}
          >
            🏭 Purchase Return
          </Button>
        </div>

        {/* 🧾 Sales Return Table */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading returns...</p>
          </div>
        ) : (
          <>
            {activeTab === "sales" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-semibold text-secondary">
                    Total Returns: <Badge bg="info">{filteredSales.length}</Badge> | 
                    Total Value: <Badge bg="success">₹{totalSales.toFixed(2)}</Badge>
                  </h5>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => exportCSV("sales", filteredSales)}
                  >
                    <Download size={16} className="me-1" /> Export CSV
                  </Button>
                </div>

                <Table bordered hover responsive className="align-middle text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Reason</th>
                      <th>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length > 0 ? (
                      filteredSales.map((r, i) => (
                        <tr key={r.id}>
                          <td>{i + 1}</td>
                          <td>{formatDateTime(r.date)}</td>
                          <td>{r.customer_name}</td>
                          <td>{r.reason || "-"}</td>
                          <td>{Number(r.total || 0).toFixed(2)}</td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-muted py-3">
                          No sales return found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </>
            )}

            {/* 🏭 Purchase Return Table */}
            {activeTab === "purchase" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-semibold text-secondary">
                    Total Returns: <Badge bg="info">{filteredPurchase.length}</Badge> | 
                    Total Value: <Badge bg="warning">₹{totalPurchase.toFixed(2)}</Badge>
                  </h5>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => exportCSV("purchase", filteredPurchase)}
                  >
                    <Download size={16} className="me-1" /> Export CSV
                  </Button>
                </div>

                <Table bordered hover responsive className="align-middle text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Reason</th>
                      <th>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchase.length > 0 ? (
                      filteredPurchase.map((r, i) => (
                        <tr key={r.id}>
                          <td>{i + 1}</td>
                          <td>{formatDateTime(r.date)}</td>
                          <td>{r.supplier_name}</td>
                          <td>{r.reason || "-"}</td>
                          <td>{Number(r.total || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-muted py-3">
                          No purchase return found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default ReturnDashboard;

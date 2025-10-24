import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Table, Card, Badge, Spinner, Row, Col } from "react-bootstrap";

function ExpiryReport() {
  const [data, setData] = useState({ expired: [], nearExpiry: [], expiredCount: 0, nearCount: 0 });
  const [loading, setLoading] = useState(true);

  // ✅ Fetch expiry report from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/reports/expiry");
        setData(res.data || {});
      } catch (err) {
        console.error("❌ Failed to load expiry report:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading Expiry Report...</p>
      </div>
    );
  }

  // ✅ Calculate totals
  const totalExpiredValue = data.expired?.reduce((sum, r) => sum + (r.qty * r.purchase_rate), 0);
  const totalNearValue = data.nearExpiry?.reduce((sum, r) => sum + (r.qty * r.purchase_rate), 0);
  const totalItems = (data.expiredCount || 0) + (data.nearCount || 0);

  return (
    <div className="mt-4">
      <h3 className="fw-bold mb-4">
        📅 Expiry Report{" "}
        <Badge bg="secondary" className="ms-2">
          Total Items: {totalItems}
        </Badge>
      </h3>

      {/* Summary Section */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-danger shadow-sm">
            <Card.Body>
              <h5 className="fw-bold text-danger">❌ Expired</h5>
              <p className="mb-1 text-muted">Products: {data.expiredCount}</p>
              <p className="fw-semibold text-danger">
                Total Value: ₹{totalExpiredValue.toFixed(2)}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-warning shadow-sm">
            <Card.Body>
              <h5 className="fw-bold text-warning">⚠️ Near Expiry (≤ 30 Days)</h5>
              <p className="mb-1 text-muted">Products: {data.nearCount}</p>
              <p className="fw-semibold text-warning">
                Total Value: ₹{totalNearValue.toFixed(2)}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Expired Section */}
      <Card className="mb-4 border-danger shadow-sm">
        <Card.Header className="bg-danger text-white fw-bold">
          ❌ Expired Medicines ({data.expired?.length || 0})
        </Card.Header>
        <Card.Body>
          {data.expired?.length === 0 ? (
            <p className="text-muted mb-0">✅ No expired medicines in stock.</p>
          ) : (
            <Table bordered hover responsive className="text-center align-middle">
              <thead className="table-danger">
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Qty</th>
                  <th>MRP</th>
                  <th>Purchase Rate</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {data.expired.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="text-start fw-semibold">{item.product_name}</td>
                    <td>{item.batch_no || "-"}</td>
                    <td>
                      {item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td>{item.qty}</td>
                    <td>₹{Number(item.mrp).toFixed(2)}</td>
                    <td>₹{Number(item.purchase_rate).toFixed(2)}</td>
                    <td>{item.supplier_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Near Expiry Section */}
      <Card className="border-warning shadow-sm">
        <Card.Header className="bg-warning fw-bold text-dark">
          ⚠️ Near Expiry (within 30 days) ({data.nearExpiry?.length || 0})
        </Card.Header>
        <Card.Body>
          {data.nearExpiry?.length === 0 ? (
            <p className="text-muted mb-0">✅ No medicines nearing expiry in stock.</p>
          ) : (
            <Table bordered hover responsive className="text-center align-middle">
              <thead className="table-warning">
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Qty</th>
                  <th>MRP</th>
                  <th>Purchase Rate</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {data.nearExpiry.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="text-start fw-semibold">{item.product_name}</td>
                    <td>{item.batch_no || "-"}</td>
                    <td>
                      {item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td>{item.qty}</td>
                    <td>₹{Number(item.mrp).toFixed(2)}</td>
                    <td>₹{Number(item.purchase_rate).toFixed(2)}</td>
                    <td>{item.supplier_name || "-"}</td>
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

export default ExpiryReport;

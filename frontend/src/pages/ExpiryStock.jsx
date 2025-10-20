import React, { useEffect, useState } from "react";
import { Card, Table, Spinner, Badge } from "react-bootstrap";
import API from "../api/axios";

function ExpiryStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch current stock with expiry info
  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await API.get("/current-stock");
        setStock(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch expiry stock:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStock();
  }, []);

  // ✅ Expiry filters
  const isExpired = (expiryStr) => {
    if (!expiryStr || expiryStr === "—") return false;
    const [month, year] = expiryStr.split("/").map(Number);
    const expiryDate = new Date(2000 + year, month, 0);
    return expiryDate < new Date();
  };

  const isNearExpiry = (expiryStr) => {
    if (!expiryStr || expiryStr === "—") return false;
    const [month, year] = expiryStr.split("/").map(Number);
    const expiryDate = new Date(2000 + year, month, 0);
    const diff = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  const expiredProducts = stock.filter((s) => isExpired(s.expiry));
  const nearExpiryProducts = stock.filter((s) => isNearExpiry(s.expiry));

  return (
    <div className="container mt-4">
      <h3 className="fw-bold mb-4">💀 Expired & Near Expiry Medicines</h3>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading expiry stock...</p>
        </div>
      ) : (
        <>
          {/* Expired Medicines */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-danger text-white fw-bold">
              Expired Medicines ({expiredProducts.length})
            </Card.Header>
            <Card.Body>
              {expiredProducts.length > 0 ? (
                <Table bordered hover responsive>
                  <thead className="table-dark text-center">
                    <tr>
                      <th>#</th>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Expiry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredProducts.map((m, i) => (
                      <tr key={i} className="text-center">
                        <td>{i + 1}</td>
                        <td className="text-start">{m.name}</td>
                        <td>{m.batch || "-"}</td>
                        <td>{m.qty}</td>
                        <td>{m.expiry}</td>
                        <td>
                          <Badge bg="danger">Expired</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">
                  ✅ No expired medicines found
                </p>
              )}
            </Card.Body>
          </Card>

          {/* Near Expiry Medicines */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-warning text-dark fw-bold">
              Near Expiry Medicines (within 30 days) ({nearExpiryProducts.length})
            </Card.Header>
            <Card.Body>
              {nearExpiryProducts.length > 0 ? (
                <Table bordered hover responsive>
                  <thead className="table-dark text-center">
                    <tr>
                      <th>#</th>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Expiry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearExpiryProducts.map((m, i) => (
                      <tr key={i} className="text-center">
                        <td>{i + 1}</td>
                        <td className="text-start">{m.name}</td>
                        <td>{m.batch || "-"}</td>
                        <td>{m.qty}</td>
                        <td>{m.expiry}</td>
                        <td>
                          <Badge bg="warning" text="dark">
                            Near Expiry
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">
                  ✅ No near-expiry medicines found
                </p>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}

export default ExpiryStock;

import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Container, Card, Table, Badge, Spinner } from "react-bootstrap";

export default function LowStockMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const res = await API.get("/medicines/reorder-alert");
      setMedicines(res.data.medicines || []);
      setMessage(res.data.message || "");
    } catch (err) {
      console.error("Failed to fetch low stock medicines", err);
      setMessage("❌ Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h5 className="mb-0">⚠ Low Stock Medicines</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading...</p>
            </div>
          ) : medicines.length === 0 ? (
            <p className="text-success fw-bold">{message}</p>
          ) : (
            <>
              <p className="text-danger fw-bold">{message}</p>
              <Table bordered hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Reorder Level</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m, i) => (
                    <tr key={m.id}>
                      <td>{i + 1}</td>
                      <td>{m.name}</td>
                      <td>{m.category}</td>
                      <td>{m.supplier}</td>
                      <td>
                        <Badge bg={m.quantity <= m.reorder_level ? "danger" : "success"}>
                          {m.quantity}
                        </Badge>
                      </td>
                      <td>{m.reorder_level}</td>
                      <td>{m.expiry_date}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

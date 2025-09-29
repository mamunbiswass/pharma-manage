import React, { useEffect, useState } from "react";
import { Table, Spinner, Container, Card, Badge } from "react-bootstrap";
import API from "../../api/axios";

export default function RetailersList() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/retailers/");
      setRetailers(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load retailers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge bg="success">Approved</Badge>;
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "rejected":
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Retailers List</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {retailers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No retailers found
                    </td>
                  </tr>
                )}
                {retailers.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

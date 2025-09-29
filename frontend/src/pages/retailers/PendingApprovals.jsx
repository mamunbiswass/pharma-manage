import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Container, Card } from "react-bootstrap";
import API from "../../api/axios";

export default function PendingApprovals() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/retailers/pending");
      setRetailers(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load pending retailers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await API.put(`/admin/retailers/${id}/${action}`);
      alert(`Retailer ${action}ed successfully`);
      fetchRetailers();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} retailer`);
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Pending Retailer Approvals</h5>
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
                  <th>Registered On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {retailers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No pending approvals
                    </td>
                  </tr>
                )}
                {retailers.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>{r.status}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="success"
                        className="me-2"
                        onClick={() => handleAction(r.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleAction(r.id, "reject")}
                      >
                        Reject
                      </Button>
                    </td>
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Table, Container, Button, Toast, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function CancelledSales() {
  const [sales, setSales] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sales");
      setSales(res.data.filter((s) => s.status === "cancelled"));
    } catch (err) {
      showToastMessage("Failed to load cancelled sales");
    }
  };

  // ✅ Toast helper
  const showToastMessage = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  // ✅ Confirm Restore Modal
  const confirmRestore = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  // ✅ Restore API call
  const restoreSale = async () => {
    if (!selectedSale) return;
    try {
      await axios.patch(`http://localhost:5000/api/sales/${selectedSale.id}/restore`);
      showToastMessage("Sale restored successfully");
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToastMessage("Failed to restore sale");
      setShowModal(false);
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Cancelled Sales</h4>
          <Button variant="outline-light" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Card.Header>
        <Card.Body>
          <Table bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td>{s.invoice_number}</td>
                  <td>{s.invoice_date}</td>
                  <td>{s.customer_name}</td>
                  <td>{Number(s.total_amount).toFixed(2)}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => confirmRestore(s)}
                    >
                      Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* ✅ Confirm Restore Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Restore</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Do you want to restore sale (
          <strong>{selectedSale?.invoice_number}</strong>) back to active?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="success" onClick={restoreSale}>
            Yes, Restore
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Toast */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={3000}
        autohide
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          minWidth: "250px",
        }}
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </Container>
  );
}

export default CancelledSales;

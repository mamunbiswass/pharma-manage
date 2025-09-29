// frontend/src/retailer/pages/RetailerOrders.jsx
import React, { useEffect, useState } from "react";
import { Container, Table, Button, Badge, Modal, Spinner } from "react-bootstrap";
import API from "../services/api";
import RetailerHeader from "../components/RetailerHeader";

function authHeaders() {
  const token = localStorage.getItem("retailerToken");
  return { headers: { Authorization: `Bearer ${token}` } };
}

export default function RetailerOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/retailer/orders", authHeaders());
      setOrders(res.data); // ধরে নিচ্ছি backend array দিচ্ছে
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <>
    <RetailerHeader/>    
    <Container className="mt-4">
      <h4 className="mb-3 fw-bold">📦 My Orders</h4>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.order_date.split(" ")[0]}</td>
                  <td>₹{order.total_amount}</td>
                  <td>
                    <Badge
                      bg={
                        order.status === "completed"
                          ? "success"
                          : order.status === "pending"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleView(order)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {/* Order Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p>
                <strong>Order ID:</strong> #{selectedOrder.id}
              </p>
              <strong>Date:</strong> {selectedOrder.order_date}
              <p>
                <strong>Status:</strong>{" "}
                <Badge bg="info">{selectedOrder.status}</Badge>
              </p>

              <h6>Items:</h6>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td>₹{item.price * item.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">No items available</td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan="3" className="text-end fw-bold">
                      Grand Total
                    </td>
                    <td className="fw-bold">₹{selectedOrder.total_amount}</td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
    </>
  );
}

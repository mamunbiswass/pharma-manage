import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Card, Table, Button, Form, Row, Col, Spinner, Toast, ToastContainer } from "react-bootstrap";

function PurchaseReturn() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  // ✅ Load suppliers
  useEffect(() => {
    API.get("/suppliers").then(res => setSuppliers(res.data));
  }, []);

  // ✅ Search medicines
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (search.length >= 2) {
        setLoading(true);
        const res = await API.get(`/product_master/search?q=${encodeURIComponent(search)}`);
        setFilteredMeds(res.data);
        setLoading(false);
      } else setFilteredMeds([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  // ✅ Select medicine
  const handleSelect = async (med) => {
    const res = await API.get(`/stock/batches/${med.id}`);
    const b = res.data[0];
    if (!b) return alert("No batch found");
    const newItem = {
      medicine_id: med.id,
      product_name: med.name,
      batch_no: b.batch_no,
      qty: 1,
      rate: Number(b.purchase_rate),
      gst_rate: Number(b.gst_rate),
      amount: Number(b.purchase_rate),
    };
    setItems([...items, newItem]);
    setSearch("");
    setFilteredMeds([]);
  };

  const handleQtyChange = (i, val) => {
    const updated = [...items];
    updated[i].qty = Number(val);
    updated[i].amount = updated[i].qty * updated[i].rate;
    setItems(updated);
  };

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const total = items.reduce((s, it) => s + it.amount, 0);

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) return alert("Select supplier & add items!");
    const data = {
      supplier_id: supplierId,
      date: new Date().toISOString().slice(0, 10),
      reason,
      remarks,
      items,
    };
    await API.post("/purchase-returns", data);
    setToast({ show: true, message: "Purchase Return Saved ✅" });
    setItems([]);
  };

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header className="bg-warning text-dark">
        <h4 className="fw-bold mb-0">🔁 Purchase Return</h4>
      </Card.Header>
      <Card.Body>
        {/* Supplier Section */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Supplier</Form.Label>
            <Form.Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Reason</Form.Label>
            <Form.Control value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for return" />
          </Col>
          <Col md={4}>
            <Form.Label>Remarks</Form.Label>
            <Form.Control value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </Col>
        </Row>

        {/* Medicine Search */}
        <Row className="mb-3 position-relative">
          <Col md={6}>
            <Form.Control
              type="text"
              placeholder="Search medicine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <Spinner size="sm" animation="border" />}
            {filteredMeds.length > 0 && (
              <div className="position-absolute bg-white border rounded w-100" style={{ zIndex: 10 }}>
                {filteredMeds.map(m => (
                  <div
                    key={m.id}
                    className="p-2 hover:bg-light"
                    onClick={() => handleSelect(m)}
                    style={{ cursor: "pointer" }}
                  >
                    {m.name}
                  </div>
                ))}
              </div>
            )}
          </Col>
        </Row>

        {/* Items Table */}
        {items.length > 0 && (
          <Table bordered hover responsive className="text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{it.product_name}</td>
                  <td>{it.batch_no}</td>
                  <td>
                    <Form.Control
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={(e) => handleQtyChange(i, e.target.value)}
                    />
                  </td>
                  <td>{it.rate}</td>
                  <td>{it.amount.toFixed(2)}</td>
                  <td>
                    <Button size="sm" variant="outline-danger" onClick={() => removeItem(i)}>❌</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <div className="text-end mt-3 border-top pt-3">
          <h5>Total Return Value: ₹{total.toFixed(2)}</h5>
          <Button variant="warning" onClick={handleSubmit}>💾 Save Return</Button>
        </div>
      </Card.Body>

      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} bg="success" onClose={() => setToast({ show: false })} delay={3000} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  );
}

export default PurchaseReturn;

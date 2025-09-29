import React, { useEffect, useState } from "react";
import API from "../api/axios";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  Table,
  ListGroup,
  Modal,
  Toast,
  ToastContainer,
  Spinner,
} from "react-bootstrap";

function PurchaseBill() {
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billType, setBillType] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueAmount, setDueAmount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [modalShow, setModalShow] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadInitial() {
      try {
        const [sup, unit] = await Promise.all([API.get("/suppliers"), API.get("/units")]);
        setSuppliers(Array.isArray(sup.data) ? sup.data : []);
        setUnits(Array.isArray(unit.data) ? unit.data : []);
      } catch (err) {
        console.error("Initial data load failed:", err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setLoadingSearch(true);
        try {
          const res = await API.get(`/product_master/search?q=${encodeURIComponent(search)}`);
          setFilteredMeds(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error("Search failed:", err);
          setFilteredMeds([]);
        } finally {
          setLoadingSearch(false);
        }
      } else setFilteredMeds([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelect = (med) => {
    const exists = items.some((it) => it.product_id === med.id);
    if (exists) return showAlert("⚠️ This product is already added!");

    const newItem = {
      product_id: med.id,
      name: med.name,
      batch_no: "",
      expiry_date: "",
      qty: 1,
      free_qty: 0,
      unit: med.unit || "",
      mrp: Number(med.mrp_price) || 0,
      rate: Number(med.purchase_price) || 0,
      disc: 0,
      gst_rate: Number(med.gst_rate) || 0,
    };

    setItems((prev) => [...prev, calculateAmounts(newItem)]);
    setSearch("");
    setFilteredMeds([]);
  };

const calculateAmounts = (item) => {
  // ensure numeric values
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  let disc = Number(item.disc) || 0;
  const gstRate = Number(item.gst_rate) || 0;

  // 🔒 limit discount between 0–100
  if (disc < 0) disc = 0;
  if (disc > 100) disc = 100;

  // main calculations
  const discountAmount = qty * rate * (disc / 100);
  const baseAmount = qty * rate - discountAmount;
  const gst = baseAmount * (gstRate / 100);
  const total = baseAmount + gst;

  // return structured item with 2-decimal precision
  return {
    ...item,
    disc,
    discountAmount: Number(discountAmount.toFixed(2)),
    baseAmount: Number(baseAmount.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = calculateAmounts({
      ...updated[index],
      [field]: ["qty", "free_qty", "rate", "disc", "gst_rate"].includes(field)
        ? Number(value)
        : value,
    });
    setItems(updated);
  };

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, it) => s + it.baseAmount, 0);
  const totalDisc = items.reduce((s, it) => s + it.discountAmount, 0);
  const totalGst = items.reduce((s, it) => s + it.gst, 0);
  const grandTotal = items.reduce((s, it) => s + it.total, 0);

  useEffect(() => {
    const due = Number(grandTotal) - Number(paidAmount || 0);
    setDueAmount(due > 0 ? due.toFixed(2) : 0);
  }, [grandTotal, paidAmount]);

  const handleSubmit = async () => {
    if (!supplierId) return showAlert("⚠ Please select supplier!");
    if (!invoiceNo) return showAlert("⚠ Enter invoice number!");
    if (items.length === 0) return showAlert("⚠ Add at least one product!");

    const billData = {
      supplier_id: supplierId,
      invoice_no: invoiceNo,
      invoice_date: selectedDate,
      bill_type: billType,
      payment_status: paymentStatus,
      payment_mode: paymentMode,
      paid_amount: paidAmount || 0,
      due_amount: dueAmount,
      total_amount: grandTotal,
      round_off: roundOff || 0,
      items: items.map((it) => ({
        medicine_id: it.product_id,
        product_name: it.name,
        batch_no: it.batch_no,
        expiry_date: it.expiry_date,
        quantity: it.qty,
        free_qty: it.free_qty,
        unit: it.unit,
        purchase_rate: it.rate,
        mrp: it.mrp,
        gst_rate: it.gst_rate,
        discount: it.disc,
        total: it.total,
      })),
    };

    try {
      await API.post("/purchase-bills", billData);
      setToastMessage("✅ Purchase Bill Saved Successfully!");
      setToastShow(true);
      resetForm();
    } catch (err) {
      console.error("Save failed:", err);
      showAlert("❌ Failed to save purchase bill!");
    }
  };

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalShow(true);
  };

  const resetForm = () => {
    setSupplierId("");
    setInvoiceNo("");
    setItems([]);
    setPaidAmount("");
  };

  const getDateOption = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
  };

  const dateOptions = [
    { label: "Today", value: getDateOption(0) },
    { label: "Yesterday", value: getDateOption(1) },
    { label: "2 Days Ago", value: getDateOption(2) },
    { label: "3 Days Ago", value: getDateOption(3) },
  ];

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-success text-white py-3">
          <h4 className="fw-bold mb-0">🧾 New Purchase Bill</h4>
        </Card.Header>
        <Card.Body>
          {/* Supplier & Invoice Info */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Form.Label>Supplier</Form.Label>
              <Form.Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Invoice No</Form.Label>
              <Form.Control value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label>Date</Form.Label>
              <Form.Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                {dateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.value}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Bill Type</Form.Label>
              <Form.Select value={billType} onChange={(e) => setBillType(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Payment Info */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Form.Label>Payment Status</Form.Label>
              <Form.Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Payment Mode</Form.Label>
              <Form.Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Paid Amount</Form.Label>
              <Form.Control
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Due Amount</Form.Label>
              <Form.Control type="number" value={dueAmount} readOnly />
            </Col>
          </Row>

          {/* Product Search */}
          <Row className="g-2 mb-4 align-items-end">
            <Col md={6} className="position-relative">
              <Form.Label>💊 Search Product</Form.Label>
              <Form.Control
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type product name..."
              />
              {loadingSearch && (
                <Spinner animation="border" size="sm" className="position-absolute end-0 top-50 me-3" />
              )}
              {filteredMeds.length > 0 && (
                <ListGroup className="position-absolute w-100" style={{ zIndex: 1000, maxHeight: "220px", overflowY: "auto" }}>
                  {filteredMeds.map((m) => (
                    <ListGroup.Item
                      key={m.id}
                      action
                      onClick={() => handleSelect(m)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>{m.name}</span>
                      <span className="text-success fw-semibold">₹{m.purchase_price ?? 0}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
          </Row>

          {/* Items Table */}
          {items.length > 0 && (
            <>
              <Table bordered responsive hover>
                <thead className="table-dark text-center">
                  <tr>
                    <th>SN</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Free</th>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th>MRP</th>
                    <th>Rate</th>
                    <th>Disc%</th>
                    <th>GST%</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{it.name}</td>
                      <td><Form.Control type="number" min="1" value={it.qty} onChange={(e) => handleItemChange(i, "qty", e.target.value)} /></td>
                      <td><Form.Control type="number" min="0" value={it.free_qty} onChange={(e) => handleItemChange(i, "free_qty", e.target.value)} /></td>
                      <td><Form.Control value={it.batch_no} onChange={(e) => handleItemChange(i, "batch_no", e.target.value)} /></td>
                      <td><Form.Control type="month" value={it.expiry_date ? it.expiry_date.slice(0, 7) : ""} onChange={(e) => handleItemChange(i, "expiry_date", e.target.value + "-01")} /></td>
                      <td>{it.mrp.toFixed(2)}</td>
                      <td><Form.Control type="number" value={it.rate} onChange={(e) => handleItemChange(i, "rate", e.target.value)} /></td>
                      <td><Form.Control type="number" value={it.disc} onChange={(e) => handleItemChange(i, "disc", e.target.value)} /></td>
                      <td>{it.gst_rate}%</td>
                      <td className="fw-bold text-end">₹{it.total.toFixed(2)}</td>
                      <td><Button size="sm" variant="outline-danger" onClick={() => removeItem(i)}>❌</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="text-end mt-3 border-top pt-3">
                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p>Discount: ₹{totalDisc.toFixed(2)}</p>
                <p>GST: ₹{totalGst.toFixed(2)}</p>
                <h5 className="fw-bold text-success">Grand Total: ₹{grandTotal.toFixed(2)}</h5>
                <Button variant="primary" size="lg" onClick={handleSubmit}>💾 Save Bill</Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
        <Modal.Header closeButton><Modal.Title>⚠ Notice</Modal.Title></Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
      </Modal>

      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toastShow} bg="success" onClose={() => setToastShow(false)} delay={3000} autohide>
          <Toast.Body className="text-white fw-semibold">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}

export default PurchaseBill;

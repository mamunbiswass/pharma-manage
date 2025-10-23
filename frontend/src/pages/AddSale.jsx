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

function AddSale() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [billType, setBillType] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueAmount, setDueAmount] = useState(0);
  const [search, setSearch] = useState("");
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [modalShow, setModalShow] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // ✅ Load customers
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/customers");
        setCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Customer load failed:", err);
      }
    })();
  }, []);

  // ✅ Live search medicine
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setLoadingSearch(true);
        try {
          const res = await API.get(
            `/product_master/search?q=${encodeURIComponent(search)}`
          );
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

  // ✅ Select medicine and add to table
  const handleSelect = async (med) => {
    const exists = items.some((it) => it.medicine_id === med.id);
    if (exists) return showAlert("⚠ This medicine already added!");

    try {
      const res = await API.get(`/stock/batches/${med.id}`);
      const batches = Array.isArray(res.data) ? res.data : [];

      console.log("📦 Loaded batches:", batches);

      if (!batches.length)
        return showAlert("⚠ No batch stock found for this product!");

      const b = batches[0];

      // ✅ Support for both 'available_qty' and 'quantity'
      const availableQty =
        b.available_qty ?? b.quantity ?? 0;

      if (availableQty <= 0)
        return showAlert("⚠ Stock not available for this product!");

      const newItem = {
        medicine_id: med.id,
        product_name: med.name,
        batch_no: b.batch_no || "-",
        expiry_date: b.expiry_date,
        pack: b.pack || "-",
        unit: b.pack || "-",
        hsn: b.hsn || "",
        qty: 1,
        mrp: Number(b.mrp) || 0,
        rate: Number(b.purchase_rate) || 0,
        disc: 0,
        gst_rate: Number(b.gst_rate) || 0,
      };

      setItems((prev) => [...prev, calculate(newItem)]);
      setSearch("");
      setFilteredMeds([]);
    } catch (err) {
      console.error("Batch fetch failed:", err);
      showAlert("❌ Failed to load stock batch!");
    }
  };

  // ✅ Calculate each row
  const calculate = (item) => {
    const disc = Math.min(100, Number(item.disc) || 0);
    const discount = item.qty * item.rate * (disc / 100);
    const base = item.qty * item.rate - discount;
    const gstHalf = (base * (item.gst_rate / 2)) / 100;
    const total = base + gstHalf * 2;
    return { ...item, disc, discount, base, sgst: gstHalf, cgst: gstHalf, total };
  };

  const handleItemChange = (i, field, val) => {
    const updated = [...items];
    updated[i] = calculate({
      ...updated[i],
      [field]: ["qty", "rate", "disc"].includes(field) ? Number(val) : val,
    });
    setItems(updated);
  };

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  // ✅ Totals
  const subtotal = items.reduce((s, it) => s + (it.base || 0), 0);
  const totalDisc = items.reduce((s, it) => s + (it.discount || 0), 0);
  const totalGST = items.reduce((s, it) => s + (it.sgst || 0) + (it.cgst || 0), 0);
  const grandTotal = subtotal + totalGST;

  useEffect(() => {
    const due = Number(grandTotal) - Number(paidAmount || 0);
    setDueAmount(due > 0 ? due.toFixed(2) : 0);
  }, [grandTotal, paidAmount]);

  // ✅ Submit Sale
  const handleSubmit = async () => {
    if (!customerId) return showAlert("⚠ Please select a customer!");
    if (items.length === 0) return showAlert("⚠ Add at least one product!");

    const data = {
      customer_id: customerId,
      date: selectedDate,
      bill_type: billType,
      payment_status: paymentStatus,
      payment_mode: paymentMode,
      paid_amount: paidAmount || 0,
      due_amount: dueAmount,
      total_amount: grandTotal,
      items: items.map((it) => ({
        medicine_id: it.medicine_id,
        product_name: it.product_name,
        batch_no: it.batch_no,
        pack: it.pack,
        unit: it.unit,
        hsn: it.hsn,
        expiry_date: it.expiry_date,
        quantity: it.qty,
        price: it.rate,
        mrp_price: it.mrp,
        gst_rate: it.gst_rate,
        disc: it.disc,
      })),
    };

    try {
      await API.post("/sales", data);
      showToast("✅ Sale saved successfully!");
      setCustomerId("");
      setItems([]);
      setPaidAmount("");
      setDueAmount(0);
    } catch (err) {
      console.error("Sale save failed:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "❌ Failed to save sale!";

      showAlert(msg);
    }
  };

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalShow(true);
  };
  const showToast = (msg) => {
    setToastMessage(msg);
    setToastShow(true);
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-primary text-white py-3">
          <h4 className="fw-bold mb-0">🧾 New Sale (Batch + Payment)</h4>
        </Card.Header>
        <Card.Body>
          {/* Customer + Date */}
          <Row className="mb-4">
            <Col md={4}>
              <Form.Label>👤 Customer</Form.Label>
              <Form.Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>📅 Date</Form.Label>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Bill Type</Form.Label>
              <Form.Select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Payment Fields */}
          <Row className="mb-4">
            <Col md={3}>
              <Form.Label>Payment Status</Form.Label>
              <Form.Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Payment Mode</Form.Label>
              <Form.Select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
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

          {/* Search Medicine */}
          <Row className="g-2 mb-4 align-items-end">
            <Col md={6} className="position-relative">
              <Form.Label>💊 Search Medicine</Form.Label>
              <Form.Control
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type medicine name..."
              />
              {loadingSearch && (
                <Spinner
                  animation="border"
                  size="sm"
                  className="position-absolute end-0 top-50 me-3"
                />
              )}
              {filteredMeds.length > 0 && (
                <ListGroup
                  className="position-absolute w-100"
                  style={{
                    zIndex: 1000,
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {filteredMeds.map((m) => (
                    <ListGroup.Item
                      key={m.id}
                      action
                      onClick={() => handleSelect(m)}
                    >
                      {m.name} — ₹{m.sale_price}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
          </Row>

          {/* Items Table */}
          {items.length > 0 && (
            <>
              <Table striped bordered hover responsive>
                <thead className="table-dark text-center">
                  <tr>
                    <th>SN</th>
                    <th>Product</th>
                    <th>Batch</th>
                    <th>Pack</th>
                    <th>HSN</th>
                    <th>Expiry</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Disc%</th>
                    <th>GST%</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{it.product_name}</td>
                      <td>{it.batch_no}</td>
                      <td>{it.unit}</td>
                      <td>{it.hsn}</td>
                      <td>
                        {it.expiry_date
                          ? new Date(it.expiry_date).toLocaleDateString("en-GB", {
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={(e) =>
                            handleItemChange(i, "qty", e.target.value)
                          }
                        />
                      </td>
                      <td>{it.rate.toFixed(2)}</td>
                      <td>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          value={it.disc}
                          onChange={(e) =>
                            handleItemChange(i, "disc", e.target.value)
                          }
                        />
                      </td>
                      <td>{it.gst_rate}%</td>
                      <td className="fw-bold text-end">₹{it.total.toFixed(2)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => removeItem(i)}
                        >
                          ❌
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Totals */}
              <div className="text-end mt-3 border-top pt-3">
                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p>Total Discount: ₹{totalDisc.toFixed(2)}</p>
                <p>GST: ₹{totalGST.toFixed(2)}</p>
                <h5 className="fw-bold text-success">
                  Grand Total: ₹{grandTotal.toFixed(2)}
                </h5>
                <Button variant="primary" size="lg" onClick={handleSubmit}>
                  💾 Save Sale
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Alert Modal */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠ Notice</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
      </Modal>

      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toastShow}
          bg="success"
          onClose={() => setToastShow(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white fw-semibold">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}

export default AddSale;

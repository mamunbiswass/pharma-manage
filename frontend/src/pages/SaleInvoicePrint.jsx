import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { Button, Card, Table, Row, Col, Image, Spinner } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import "../components/InvoicePrint.css";

function SaleInvoicePrint() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invoiceRes, businessRes, settingsRes] = await Promise.all([
          API.get(`/sales/${id}`),
          API.get("/business"),
          API.get("/invoice-settings"),
        ]);
        setInvoice(invoiceRes.data);
        setBusiness(businessRes.data);

        const data = settingsRes.data;
        data.show_logo = Boolean(Number(data.show_logo));
        data.show_qr = Boolean(Number(data.show_qr));
        setSettings(data);
      } catch (err) {
        console.error("❌ Failed to load invoice data:", err);
      }
    }
    fetchData();
  }, [id]);

  if (!invoice || !settings)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading Sale Invoice...</p>
      </div>
    );

  const { sale, items } = invoice;

  // ✅ Safe number converter
  const safeNum = (v) => {
    const n = Number(v);
    return isNaN(n) || n === null ? 0 : n;
  };

  // ✅ Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d)
      ? "-"
      : `${String(d.getDate()).padStart(2, "0")}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const formatExpiry = (expStr) => {
    if (!expStr) return "-";
    const d = new Date(expStr);
    if (isNaN(d)) return "-";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${yy}`;
  };

  // ✅ Convert number to words
  function amountInWords(amount) {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function numToWords(num) {
      if (num === 0) return "";
      if (num < 20) return ones[num];
      if (num < 100)
        return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
      if (num < 1000)
        return ones[Math.floor(num / 100)] + " Hundred " + numToWords(num % 100);
      if (num < 100000)
        return numToWords(Math.floor(num / 1000)) + " Thousand " + numToWords(num % 1000);
      if (num < 10000000)
        return numToWords(Math.floor(num / 100000)) + " Lakh " + numToWords(num % 100000);
      return numToWords(Math.floor(num / 10000000)) + " Crore " + numToWords(num % 10000000);
    }

    const [rupees, paisa] = amount.toFixed(2).split(".");
    let words = "";
    if (parseInt(rupees, 10) > 0)
      words += numToWords(parseInt(rupees, 10)) + " Rupees";
    if (parseInt(paisa, 10) > 0)
      words += " and " + numToWords(parseInt(paisa, 10)) + " Paisa";
    return words.trim() + " Only";
  }

  // ✅ UPI QR Code
  const upiId = settings?.upi?.trim() || "";
  const payeeName = encodeURIComponent(business?.name || "Business");
  const note = encodeURIComponent(`Invoice-${sale.invoice_number}`);
  const amount = encodeURIComponent(sale.total || 0);
  const qrData = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;

  // ✅ GST Summary + Item Discount Calculation
  const gstSummary = {};
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach((it) => {
    const qty = safeNum(it.qty);
    const rate = safeNum(it.rate);
    const gst = safeNum(it.gst);
    const disc = safeNum(it.disc); // item-level discount %

    const itemGross = qty * rate;
    const itemDiscount = (itemGross * disc) / 100;
    totalDiscount += itemDiscount;

    const base = itemGross - itemDiscount;
    subtotal += base;

    const gstHalf = gst / 2;
    const sgstAmt = (base * gstHalf) / 100;
    const cgstAmt = (base * gstHalf) / 100;

    const key = `${gst}%`;
    if (!gstSummary[key]) gstSummary[key] = { taxable: 0, sgst: 0, cgst: 0 };
    gstSummary[key].taxable += base;
    gstSummary[key].sgst += sgstAmt;
    gstSummary[key].cgst += cgstAmt;
  });

  const totalGst = Object.values(gstSummary).reduce(
    (sum, g) => sum + safeNum(g.sgst) + safeNum(g.cgst),
    0
  );

  const grandTotal = subtotal + totalGst;

  if (!sale.total || isNaN(sale.total)) sale.total = grandTotal;

  // ✅ UI
  return (
    <Card className="mt-4 p-4 invoice-print-area">
      <div className="text-end mb-3">
        <Button className="no-print" variant="success" onClick={() => window.print()}>
          🖨 Print / Save
        </Button>
      </div>

      {/* ===== Header ===== */}
      <Row className="mb-4 align-items-center">
        <Col md={5}>
          {!!settings.show_logo && settings.logo && (
            <Image
              src={`http://localhost:5000/uploads/logo/${settings.logo}`}
              alt="Business Logo"
              height={80}
              className="mb-2"
            />
          )}
          <h5 className="fw-bold">{business.name}</h5>
          <p>{business.address}</p>
          <p>📞 {business.phone}</p>
          <p>GSTIN: {business.tax_number}</p>
        </Col>

        <Col md={2} className="text-center">
          {!!settings.show_qr && (
            <>
              <h6 className="fw-bold mb-0">Scan & Pay</h6>
              <QRCodeCanvas value={qrData} size={150} includeMargin />
            </>
          )}
        </Col>

        <Col md={5} className="text-end">
          <h5 className="fw-bold">Customer Info</h5>
          <p><strong>Name:</strong> {sale.customer_name}</p>
          <p><strong>Phone:</strong> {sale.phone || "—"}</p>
          <p><strong>Address:</strong> {sale.address || "—"}</p>
          <p>
            <strong>Date:</strong> {formatDate(sale.created_at)}{" "}
            <strong>Time:</strong> {new Date(sale.created_at).toLocaleTimeString()}
          </p>
          <h5 className="fw-bold">🧾 Invoice #{sale.invoice_number}</h5>
        </Col>
      </Row>

      <h3 className="fw-bold text-center mb-3">SALE INVOICE</h3>

      {/* ===== Items Table ===== */}
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th>SN</th>
            <th>Product</th>
            <th>Batch</th>
            <th>Pack</th>
            <th>Exp</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>MRP</th>
            <th>Rate</th>
            <th>Disc%</th>
            <th>SGST%</th>
            <th>CGST%</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const gstHalf = Number(it.gst) / 2;
            const qty = safeNum(it.qty);
            const rate = safeNum(it.rate);
            const disc = safeNum(it.disc);
            const base = qty * rate - (qty * rate * disc) / 100;
            const sgstAmt = (base * gstHalf) / 100;
            const cgstAmt = (base * gstHalf) / 100;
            const total = base + sgstAmt + cgstAmt;

            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{it.product_name}</td>
                <td>{it.batch || "—"}</td>
                <td>{it.unit || "—"}</td>
                <td>{formatExpiry(it.expiry_date)}</td>
                <td>{it.hsn || "—"}</td>
                <td>{qty}</td>
                <td>{safeNum(it.mrp).toFixed(2)}</td>
                <td>{rate.toFixed(2)}</td>
                <td>{disc.toFixed(2)}</td>
                <td>{gstHalf.toFixed(2)}</td>
                <td>{gstHalf.toFixed(2)}</td>
                <td>{total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* ===== GST + Total Summary ===== */}
      <Row className="mt-4">
        <Col md={8}>
          <h6 className="fw-bold">GST Summary</h6>
          <Table bordered size="sm" className="text-center">
            <thead className="table-dark">
              <tr>
                <th>Class</th>
                <th>Taxable</th>
                <th>SGST</th>
                <th>CGST</th>
                <th>Total GST</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(gstSummary).length > 0 ? (
                <>
                  {Object.keys(gstSummary).map((k) => {
                    const g = gstSummary[k];
                    const totalGst = safeNum(g.sgst) + safeNum(g.cgst);
                    return (
                      <tr key={k}>
                        <td>{k}</td>
                        <td>{g.taxable.toFixed(2)}</td>
                        <td>{g.sgst.toFixed(2)}</td>
                        <td>{g.cgst.toFixed(2)}</td>
                        <td>{totalGst.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </>
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No GST data available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Col>

        {/* ✅ Totals Section */}
        <Col md={4} className="text-end sub_total">
          <div className="border p-3 bg-light rounded">
            <p className="mb-1">
              <strong>Subtotal (After Discount):</strong> ₹{subtotal.toFixed(2)}
            </p>
            <p className="mb-1">
              <strong>Total Discount:</strong> ₹{totalDiscount.toFixed(2)}
            </p>
            <p className="mb-1">
              <strong>GST:</strong> ₹{totalGst.toFixed(2)}
            </p>
            <p className="mb-1">
              <strong>Paid:</strong> ₹{safeNum(sale.paid_amount).toFixed(2)}
            </p>
            <p className="mb-2">
              <strong>Due:</strong> ₹{safeNum(sale.due_amount).toFixed(2)}
            </p>
            <h5 className="fw-bold text-success border-top pt-2 mt-2">
              Grand Total: ₹{grandTotal.toFixed(2)}
            </h5>
          </div>
        </Col>
      </Row>

      {/* ===== Footer ===== */}
      <div className="mt-4 border-top pt-3">
        <p>
          <strong>In Words:</strong> {amountInWords(safeNum(sale.total))}
        </p>
        <p className="small">{settings.footer_note}</p>
        <p className="fw-bold text-end">{settings.signature_text}</p>
      </div>
    </Card>
  );
}

export default SaleInvoicePrint;

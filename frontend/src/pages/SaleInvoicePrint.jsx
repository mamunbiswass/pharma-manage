import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { Button, Card, Table, Row, Col, Image } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import "../components/InvoicePrint.css";

function SaleInvoicePrint() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await API.get(`/sales/${id}`);
        setInvoice(res.data);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
      }
    }

    async function fetchBusiness() {
      try {
        const res = await API.get("/business");
        setBusiness(res.data);
      } catch (err) {
        console.error("Failed to fetch business info:", err);
      }
    }

    fetchInvoice();
    fetchBusiness();
  }, [id]);

  if (!invoice) return <p className="mt-4 text-center">Loading invoice...</p>;

  const { sale, items } = invoice;

  // 🧾 UPI QR code (optional)
  const upiId = "9681265732-2@ybl";
  const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    business?.name || "Business"
  )}&am=${sale.total}&cu=INR&tn=Invoice-${sale.invoice_number}`;

  // 🧮 Helpers
  const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  // 🧮 GST Summary
  const gstSummary = {};
  items.forEach((it) => {
    const qty = safeNum(it.qty);
    const rate = safeNum(it.rate);
    const disc = safeNum(it.disc);
    const sgstPct = safeNum(it.sgst);
    const cgstPct = safeNum(it.cgst);
    const base = Math.max(0, qty * rate - disc);
    const sgstAmt = (base * sgstPct) / 100;
    const cgstAmt = (base * cgstPct) / 100;
    const gstClass = (sgstPct + cgstPct).toString();

    if (!gstSummary[gstClass]) {
      gstSummary[gstClass] = { totalTaxable: 0, sgstAmt: 0, cgstAmt: 0 };
    }

    gstSummary[gstClass].totalTaxable += base;
    gstSummary[gstClass].sgstAmt += sgstAmt;
    gstSummary[gstClass].cgstAmt += cgstAmt;
  });

  // 🪙 Amount in words
  function amountInWords(amount) {
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six",
      "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
      "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty",
      "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    function numToWords(num) {
      if (num === 0) return "";
      if (num < 20) return ones[num];
      if (num < 100)
        return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
      if (num < 1000)
        return ones[Math.floor(num / 100)] + " Hundred " + numToWords(num % 100);
      if (num < 100000)
        return (
          numToWords(Math.floor(num / 1000)) + " Thousand " + numToWords(num % 1000)
        );
      if (num < 10000000)
        return (
          numToWords(Math.floor(num / 100000)) + " Lakh " + numToWords(num % 100000)
        );
      return (
        numToWords(Math.floor(num / 10000000)) +
        " Crore " +
        numToWords(num % 10000000)
      );
    }

    const [rupees, paisa] = amount.toFixed(2).split(".");
    let words = "";
    if (parseInt(rupees, 10) > 0)
      words += numToWords(parseInt(rupees, 10)) + " Rupees";
    if (parseInt(paisa, 10) > 0)
      words += " and " + numToWords(parseInt(paisa, 10)) + " Paisa";
    return words.trim() + " Only";
  }

  const formatExp = (expStr) => {
    if (!expStr) return "-";
    const date = new Date(expStr);
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
      date.getFullYear()
    ).slice(2)}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  return (
    <Card className="mt-4 p-4 invoice-print-area">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">🧾 Invoice #{sale.invoice_number}</h4>
        <Button className="no-print" variant="success" onClick={() => window.print()}>
          🖨 Print / Save
        </Button>
      </div>

      {/* Business + Customer Info */}
      <Row className="mb-4 align-items-center">
        <Col md={5} className="d-flex justify-content-start">
          {business && (
            <>
              {business.logo && (
                <Image
                  src={`http://localhost:5000/uploads/logo/${business.logo}`}
                  alt="Business Logo"
                  height={120}
                  className="mb-2 me-3"
                />
              )}
              <div>
                <h5 className="fw-bold">{business.name}</h5>
                <p className="mb-0">{business.address}</p>
                <p className="mb-0">📞 {business.phone}</p>
                <p className="mb-0">✉️ {business.email}</p>
                <p className="mb-0">GSTIN: {business.tax_number}</p>
              </div>
            </>
          )}
        </Col>

        <Col md={2} className="text-center">
          <h6 className="fw-bold">Scan & Pay</h6>
          <QRCodeCanvas value={qrData} size={110} includeMargin={true} />
          <p className="small text-muted mt-1">Pay via UPI</p>
        </Col>

        <Col md={5} className="text-end">
          <h5 className="fw-bold">Customer Info</h5>
          <p className="mb-0"><strong>Name:</strong> {sale.customer_name}</p>
          <p className="mb-0"><strong>Phone:</strong> {sale.phone || "N/A"}</p>
          <p className="mb-0"><strong>Address:</strong> {sale.address || "N/A"}</p>
          <p className="mb-0">
            <strong>Date:</strong> {formatDate(sale.created_at)},{" "}
            <strong>Time:</strong> {new Date(sale.created_at).toLocaleTimeString()}
          </p>
          <p className="mb-0"><strong>Bill Type:</strong> {sale.bill_type}</p>
          <p className="mb-0"><strong>Payment Mode:</strong> {sale.payment_mode}</p>
          <p className="mb-0"><strong>Status:</strong> {sale.payment_status}</p>
        </Col>
      </Row>

      <h3 className="fw-bold text-center mb-3">TAX INVOICE</h3>

      {/* Items Table */}
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
            const qty = safeNum(it.qty);
            const rate = safeNum(it.rate);
            const disc = safeNum(it.disc);
            const sgst = safeNum(it.sgst);
            const cgst = safeNum(it.cgst);
            const base = Math.max(0, qty * rate - (qty * rate * disc) / 100);
            const sgstAmt = (base * sgst) / 100;
            const cgstAmt = (base * cgst) / 100;
            const total = base + sgstAmt + cgstAmt;

            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{it.product_name}</td>
                <td>{it.batch || "-"}</td>
                <td>{it.pack || "-"}</td>
                <td>{formatExp(it.expiry)}</td>
                <td>{it.hsn || "-"}</td>
                <td>{qty}</td>
                <td>{safeNum(it.mrp).toFixed(2)}</td>
                <td>{rate.toFixed(2)}</td>
                <td>{disc.toFixed(2)}</td>
                <td>{sgst.toFixed(2)}</td>
                <td>{cgst.toFixed(2)}</td>
                <td className="fw-bold">{total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* GST + Payment Summary */}
      <Row className="mt-4">
        <Col md={8}>
          <h6 className="fw-bold">GST Summary</h6>
          <Table bordered size="sm" className="text-center">
            <thead>
              <tr>
                <th>Class</th>
                <th>Taxable</th>
                <th>SGST</th>
                <th>CGST</th>
                <th>Total GST</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(gstSummary).map((k) => {
                const g = gstSummary[k];
                return (
                  <tr key={k}>
                    <td>{k}%</td>
                    <td>{g.totalTaxable.toFixed(2)}</td>
                    <td>{g.sgstAmt.toFixed(2)}</td>
                    <td>{g.cgstAmt.toFixed(2)}</td>
                    <td>{(g.sgstAmt + g.cgstAmt).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <h6 className="fw-bold">Bank Details</h6>
          <div className="border p-2">
            <p><strong>Bank Name:</strong> HDFC Bank</p>
            <p><strong>A/C No:</strong> 1234567890</p>
            <p><strong>IFSC:</strong> HDFC0001234</p>
          </div>
        </Col>

        <Col md={4} className="text-end">
          <div className="border p-3">
            <p>Subtotal: ₹{safeNum(sale.subtotal).toFixed(2)}</p>
            <p>Discount: ₹{safeNum(sale.discount).toFixed(2)}</p>
            <p>SGST: ₹{safeNum(sale.sgst).toFixed(2)}</p>
            <p>CGST: ₹{safeNum(sale.cgst).toFixed(2)}</p>
            <p>Paid: ₹{safeNum(sale.paid_amount).toFixed(2)}</p>
            <p>Due: ₹{safeNum(sale.due_amount).toFixed(2)}</p>
            <h5 className="fw-bold text-success">
              Grand Total: ₹{safeNum(sale.total).toFixed(2)}
            </h5>
          </div>
        </Col>
      </Row>

      {/* Footer */}
      <div className="mt-4 border-top pt-3">
        <p><strong>In Words:</strong> {amountInWords(safeNum(sale.total))}</p>
        <p className="small">
          All subject to BERHAMPORE jurisdiction only. Goods once sold cannot be returned.
        </p>
        <p className="fw-bold text-end">For {business?.name || "Your Business"}</p>
      </div>
    </Card>
  );
}

export default SaleInvoicePrint;

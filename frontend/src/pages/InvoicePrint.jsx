// src/pages/InvoicePrint.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { Button, Card, Table, Row, Col, Image } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import "../components/InvoicePrint.css";

function InvoicePrint() {
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

  // UPI QR (optional — change UPI ID)
  const upiId = "9681265732-2@ybl";
  const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    business?.name || "Business"
  )}&am=${sale.total}&cu=INR&tn=Invoice-${sale.invoice_number}`;

  // ===== Build GST summary safely =====
  // We'll treat sgst/cgst stored PER ITEM as percentage values (e.g. 6, 9, 12)
  // Compute base (taxable) amount per item, sgst amt, cgst amt, then group by (sgst+cgst) slab
  const gstSummary = {}; // { "12": { totalTaxable: number, sgstAmt: number, cgstAmt: number } }

  items.forEach((it) => {
    // ensure numbers
    const qty = Number(it.qty || 0);
    const rate = Number(it.rate || 0);
    // it.disc might be absolute or percentage depending on your flow; here we assume discount_amount is absolute saved in item.amount? 
    // We'll use it.disc (absolute) if present, else 0
    const disc = Number(it.disc || 0); // if you store discount_amount separately, use that instead
    const sgstPct = Number(it.sgst || 0); // e.g. 6
    const cgstPct = Number(it.cgst || 0); // e.g. 6

    // taxable/base amount for the line (qty * rate - discount)
    const baseAmount = Math.max(0, qty * rate - disc);

    // calculate tax amounts
    const sgstAmt = (baseAmount * sgstPct) / 100;
    const cgstAmt = (baseAmount * cgstPct) / 100;

    // GST class key (use total gst percent e.g. 12)
    const gstClass = (sgstPct + cgstPct).toString();

    if (!gstSummary[gstClass]) {
      gstSummary[gstClass] = { totalTaxable: 0, sgstAmt: 0, cgstAmt: 0 };
    }

    gstSummary[gstClass].totalTaxable += baseAmount;
    gstSummary[gstClass].sgstAmt += sgstAmt;
    gstSummary[gstClass].cgstAmt += cgstAmt;
  });


  // ===== helper =====
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ✅ Amount in Words (Indian System)
function amountInWords(amount) {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function numToWords(num) {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred " + numToWords(num % 100);
    if (num < 100000) return numToWords(Math.floor(num / 1000)) + " Thousand " + numToWords(num % 1000);
    if (num < 10000000) return numToWords(Math.floor(num / 100000)) + " Lakh " + numToWords(num % 100000);
    return numToWords(Math.floor(num / 10000000)) + " Crore " + numToWords(num % 10000000);
  }

  const [rupees, paisa] = amount.toFixed(2).split(".");
  let words = "";

  if (parseInt(rupees, 10) > 0) {
    words += numToWords(parseInt(rupees, 10)) + " Rupees";
  }
  if (parseInt(paisa, 10) > 0) {
    words += " and " + numToWords(parseInt(paisa, 10)) + " Paisa";
  }

  return words.trim() + " Only";
}

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <Card className="mt-4 p-4 invoice-print-area">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">🧾 Invoice #{sale.invoice_number}</h4>
        <Button className="no-print" variant="success" onClick={() => window.print()}>
          🖨 Print / Save
        </Button>
      </div>

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
              <div className="business_info">
                <h5 className="fw-bold">{business.name}</h5>
                <p className="mb-0">{business.address}</p>
                <p className="mb-0">📞 {business.phone}</p>
                <p className="mb-0">✉️ {business.email}</p>
                <p className="mb-0">GST/TAX: {business.tax_number}</p>
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
          <p className="mb-0"><strong>Date:</strong> {formatDate(sale.created_at).toLocaleString()}, <strong>Time:</strong> {new Date(sale.created_at).toLocaleTimeString()}</p>
          <p className="mb-0"><strong>Invoice #:</strong> {sale.invoice_number}</p>
        </Col>
      </Row>

      <h3 className="fw-bold text-center mb-3">TAX INVOICE</h3>

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
            <th>Disc</th>
            <th>SGST</th>
            <th>CGST</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const qty = safeNum(it.qty);
            const rate = safeNum(it.rate);
            const disc = safeNum(it.disc || 0);
            const base = Math.max(0, qty * rate - disc);
            const sgstPct = safeNum(it.sgst);
            const cgstPct = safeNum(it.cgst);
            const sgstAmt = (base * sgstPct) / 100;
            const cgstAmt = (base * cgstPct) / 100;
            const lineTotal = base + sgstAmt + cgstAmt;

            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{it.product_name}</td>
                <td>{it.batch || "-"}</td>
                <td>{it.pack || "-"}</td>
                <td>{it.expiry || "-"}</td>
                <td>{it.hsn || "-"}</td>
                <td>{qty}</td>
                <td>{Number(it.mrp || 0).toFixed(2)}</td>
                <td>{rate.toFixed(2)}</td>
                <td>{disc.toFixed(2)}</td>
                <td>{sgstPct.toFixed(2)}</td>
                <td>{cgstPct.toFixed(2)}</td>
                <td className="fw-bold">{lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Row className="mt-4">
        <Col md={8}>
          <h6 className="fw-bold">GST Summary</h6>
          <Table bordered size="sm" className="text-center">
            <thead>
              <tr>
                <th>Class</th>
                <th>Total (Taxable)</th>
                <th>SGST</th>
                <th>CGST</th>
                <th>Total GST</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(gstSummary).length === 0 ? (
                <tr>
                  <td colSpan="5">No GST items</td>
                </tr>
              ) : (
                Object.keys(gstSummary).map((rateKey) => {
                  const entry = gstSummary[rateKey];
                  const totalTaxable = safeNum(entry.totalTaxable);
                  const sgstAmt = safeNum(entry.sgstAmt);
                  const cgstAmt = safeNum(entry.cgstAmt);
                  return (
                    <tr key={rateKey}>
                      <td>GST {rateKey}%</td>
                      <td>{totalTaxable.toFixed(2)}</td>
                      <td>{sgstAmt.toFixed(2)}</td>
                      <td>{cgstAmt.toFixed(2)}</td>
                      <td>{(sgstAmt + cgstAmt).toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
          <h6 className="fw-bold">Bank Details</h6>
          <div className="d-flex justify-content-between align-items-center border p-2 mb-2">
            <p><strong>Bank Name:</strong> HDFC Bank</p>
            <p><strong>A/C No:</strong> 1234567890</p>
            <p><strong>IFSC:</strong> HDFC0001234</p>
          </div>
        </Col>

        <Col md={4}>         

          <div className="text-end p-2">
            <p>Less Discount: ₹{safeNum(sale.discount).toFixed(2)}</p>
            <p>SGST Payable: ₹{safeNum(sale.sgst).toFixed(2)}</p>
            <p>CGST Payable: ₹{safeNum(sale.cgst).toFixed(2)}</p>
            <p>Round Off: ₹0.00</p>
            <h5 className="fw-bold">Grand Total: ₹{safeNum(sale.total).toFixed(2)}</h5>
          </div>
        </Col>
      </Row>

      <div className="mt-4 border-top pt-3">
        <p><strong>In Words:</strong> {amountInWords(Number(sale.total))}</p>
        <p className="small">All Subject to BERHAMPORE Jurisdiction only. Goods once sold cannot be returned.</p>
        <p className="fw-bold text-end">For {business?.name}</p>
      </div>
    </Card>
  );
}

export default InvoicePrint;

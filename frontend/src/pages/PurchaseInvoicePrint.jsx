// src/pages/PurchaseInvoicePrint.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { Button, Card, Table, Row, Col, Image, Spinner } from "react-bootstrap";
import JsBarcode from "jsbarcode";
import "../components/InvoicePrint.css";

function PurchaseInvoicePrint() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await API.get(`/purchase-bills/${id}`);
        setInvoice(res.data);
      } catch (err) {
        console.error("Failed to fetch purchase invoice:", err);
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

  useEffect(() => {
    if (invoice?.bill?.invoice_no) {
      try {
        JsBarcode("#invoice-barcode", invoice.bill.invoice_no, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 60,
        });
      } catch (err) {
        console.error("Barcode generation failed:", err);
      }
    }
  }, [invoice]);

  if (!invoice)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading Purchase Invoice...</p>
      </div>
    );

  const { bill, items } = invoice;

  const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  // ======== Convert Amount to Words ========
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
        return (
          tens[Math.floor(num / 10)] +
          (num % 10 ? " " + ones[num % 10] : "")
        );
      if (num < 1000)
        return ones[Math.floor(num / 100)] + " Hundred " + numToWords(num % 100);
      if (num < 100000)
        return (
          numToWords(Math.floor(num / 1000)) +
          " Thousand " +
          numToWords(num % 1000)
        );
      if (num < 10000000)
        return (
          numToWords(Math.floor(num / 100000)) +
          " Lakh " +
          numToWords(num % 100000)
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

  // ======== Date Formatters ========
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}-${(
      d.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  };

  // ✅ Expiry date as MM/YY
  const formatExpiry = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${yy}`;
  };

  // ======== GST Summary ========
  const gstSummary = {};
  items.forEach((it) => {
    const rate = safeNum(it.gst_rate);
    const taxable = safeNum(it.total) / (1 + rate / 100);
    const gstAmt = safeNum(it.total) - taxable;
    if (!gstSummary[rate]) gstSummary[rate] = { taxable: 0, gst: 0 };
    gstSummary[rate].taxable += taxable;
    gstSummary[rate].gst += gstAmt;
  });

  return (
    <Card className="mt-4 p-4 invoice-print-area">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">📦 Purchase Invoice #{bill.invoice_no}</h4>
        <Button
          className="no-print"
          variant="success"
          onClick={() => window.print()}
        >
          🖨 Print / Save
        </Button>
      </div>

      <Row className="mb-4 align-items-center">
        <Col md={4}>
          {business && (
            <>
              {business.logo && (
                <Image
                  src={`http://localhost:5000/uploads/logo/${business.logo}`}
                  alt="Business Logo"
                  height={100}
                  className="mb-2 me-3"
                />
              )}
              <h5 className="fw-bold">{business.name}</h5>
              <p className="mb-0">{business.address}</p>
              <p className="mb-0">📞 {business.phone}</p>
              <p className="mb-0">GSTIN: {business.tax_number}</p>
            </>
          )}
        </Col>

        <Col md={4} className="text-center">
          <svg id="invoice-barcode"></svg>
        </Col>

        <Col md={4} className="text-end">
          <h5 className="fw-bold">Supplier Info</h5>
          <p className="mb-0">
            <strong>{bill.supplier_name}</strong>
          </p>
          <p className="mb-0">
            <strong>Date:</strong> {formatDate(bill.invoice_date)}
          </p>
          <p className="mb-0">
            <strong>Status:</strong> {bill.payment_status}
          </p>
          <p className="mb-0">
            <strong>Mode:</strong> {bill.payment_mode}
          </p>
        </Col>
      </Row>

      <h3 className="fw-bold text-center mb-3">PURCHASE INVOICE</h3>

      {/* ===== Items Table ===== */}
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th>SN</th>
            <th>Product</th>
            <th>HSN Code</th>
            <th>Batch</th>
            <th>Unit</th>
            <th>Exp</th>
            <th>Qty</th>
            <th>Free</th>
            <th>Rate</th>
            <th>MRP</th>
            <th>GST%</th>
            <th>Disc%</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{it.product_name}</td>
              <td>{it.hsn_code || "—"}</td> {/* ✅ Show HSN properly */}
              <td>{it.batch_no || "—"}</td>
              <td>{it.unit || "—"}</td>
              <td>{formatExpiry(it.expiry_date)}</td>
              <td>{safeNum(it.quantity)}</td>
              <td>{safeNum(it.free_qty)}</td>
              <td>{safeNum(it.purchase_rate).toFixed(2)}</td>
              <td>{safeNum(it.mrp).toFixed(2)}</td>
              <td>{safeNum(it.gst_rate).toFixed(2)}</td>
              <td>{safeNum(it.discount).toFixed(2)}</td>
              <td className="fw-bold">{safeNum(it.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* ===== GST Summary & Totals ===== */}
      <Row className="mt-4">
        <Col md={8}>
          <h6 className="fw-bold">GST Summary</h6>
          <Table bordered size="sm" className="text-center">
            <thead>
              <tr>
                <th>GST%</th>
                <th>Taxable Value</th>
                <th>GST Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(gstSummary).map((gstKey) => {
                const entry = gstSummary[gstKey];
                return (
                  <tr key={gstKey}>
                    <td>{gstKey}%</td>
                    <td>{entry.taxable.toFixed(2)}</td>
                    <td>{entry.gst.toFixed(2)}</td>
                    <td>{(entry.taxable + entry.gst).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>

        <Col md={4} className="text-end">
          <div className="border p-3">
            <p>Total Amount: ₹{safeNum(bill.total_amount).toFixed(2)}</p>
            <p>Paid Amount: ₹{safeNum(bill.paid_amount).toFixed(2)}</p>
            <p>Due Amount: ₹{safeNum(bill.due_amount).toFixed(2)}</p>
            <p>Payment Mode: {bill.payment_mode}</p>
            <h5 className="fw-bold text-success mt-2">
              Grand Total: ₹{safeNum(bill.total_amount).toFixed(2)}
            </h5>
          </div>
        </Col>
      </Row>

      {/* ===== Footer ===== */}
      <div className="mt-4 border-top pt-3">
        <p>
          <strong>In Words:</strong> {amountInWords(safeNum(bill.total_amount))}
        </p>
        <p className="small">
          Goods once purchased cannot be returned. All disputes subject to local
          jurisdiction.
        </p>
        <p className="fw-bold text-end">
          For {business?.name || "Your Pharmacy"}
        </p>
      </div>
    </Card>
  );
}

export default PurchaseInvoicePrint;

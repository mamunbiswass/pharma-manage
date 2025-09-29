import React, { useState } from "react";
import { Card, Button, Form, ProgressBar, Alert } from "react-bootstrap";
import API from "../api/axios";
import Papa from "papaparse"; // optional if you want to generate csv dynamically

function BulkImportProducts() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

  // ===================
  // Handle file upload
  // ===================
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setProgress(0);
      const res = await API.post("/product_master/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (p) =>
          setProgress(Math.round((p.loaded * 100) / p.total)),
      });

      setMessage({
        type: "success",
        text: `${res.data.message} (${res.data.skippedCount} skipped)`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({
        type: "danger",
        text: err.response?.data?.error || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  // ===================
  // Download Sample CSV
  // ===================
  const handleDownloadSample = () => {
    const sampleData = [
      {
        name: "Paracetamol 500mg",
        manufacturer: "Alkem Labs",
        category: "Tablet",
        unit: "Strip",
        pack_size: "10 Tab",
        hsn_code: "30049011",
        gst_rate: "12",
        purchase_price: "10.00",
        sale_price: "12.00",
        mrp_price: "15.00",
        stock: "100",
      },
      {
        name: "Amoxicillin 250mg",
        manufacturer: "Sun Pharma",
        category: "Capsule",
        unit: "Strip",
        pack_size: "10 Cap",
        hsn_code: "30031020",
        gst_rate: "5",
        purchase_price: "25.00",
        sale_price: "30.00",
        mrp_price: "35.00",
        stock: "50",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_product_master.csv";
    link.click();
  };

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
        <span>📦 Bulk Import Products (CSV)</span>
        <Button variant="light" size="sm" onClick={handleDownloadSample}>
          📥 Download Sample CSV
        </Button>
      </Card.Header>

      <Card.Body>
        <Form onSubmit={handleUpload}>
          <Form.Group className="mb-3">
            <Form.Label>Select CSV File</Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Form.Group>

          {uploading && <ProgressBar now={progress} label={`${progress}%`} />}

          <div className="mt-3">
            <Button type="submit" variant="success" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload & Import"}
            </Button>
          </div>
        </Form>

        {message && (
          <Alert
            variant={message.type}
            className="mt-3"
            onClose={() => setMessage(null)}
            dismissible
          >
            {message.text}
          </Alert>
        )}

        <div className="mt-3 small text-muted">
          <strong>📘 Expected CSV Columns:</strong> <br />
          name, manufacturer, category, unit, pack_size, hsn_code, gst_rate,
          purchase_price, sale_price, mrp_price, stock
        </div>
      </Card.Body>
    </Card>
  );
}

export default BulkImportProducts;

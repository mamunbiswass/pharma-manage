import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Card, Button, Form, Image, Spinner } from "react-bootstrap";

export default function InvoiceSettings() {
  const [settings, setSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await API.get("/invoice-settings");
        setSettings(res.data);
      } catch (err) {
        console.error("Failed to load invoice settings:", err);
      }
    }
    fetchSettings();
  }, []);

  const handleLogoUpload = async () => {
    if (!logoFile) return alert("Please select a logo file first!");
    const formData = new FormData();
    formData.append("logo", logoFile);

    try {
      setSaving(true);
      const res = await API.post("/invoice-settings/upload-logo", formData);
      alert("✅ Logo uploaded successfully!");
      setSettings((prev) => ({ ...prev, logo: res.data.filename }));
    } catch (err) {
      console.error(err);
      alert("❌ Failed to upload logo");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await API.put("/invoice-settings", settings);
      alert("✅ Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings.logo) return alert("No logo to delete.");
    if (!window.confirm("Delete logo permanently?")) return;
    try {
      await API.delete(`/invoice-settings/logo/${settings.logo}`);
      setSettings({ ...settings, logo: null });
      alert("✅ Logo deleted successfully!");
    } catch (err) {
      alert("❌ Logo deletion failed!");
    }
  };

  if (!settings)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading settings...</p>
      </div>
    );

  return (
    <Card className="p-4 mt-4 shadow-sm">
      <h4 className="fw-bold mb-3">🧾 Invoice Settings</h4>

      {/* Logo Section */}
      <div className="mb-3">
        <Form.Label>Business Logo</Form.Label>
        <div className="d-flex align-items-center gap-3">
          {settings.logo ? (
            <Image
              src={`http://localhost:5000/uploads/logo/${settings.logo}`}
              height={80}
              rounded
            />
          ) : (
            <span className="text-muted">No logo uploaded</span>
          )}
          <Form.Control
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files[0])}
            className="w-auto"
          />
          <Button variant="primary" onClick={handleLogoUpload} disabled={saving}>
            Upload
          </Button>
          {settings.logo && (
            <Button
              variant="outline-danger"
              onClick={handleDeleteLogo}
              disabled={saving}
            >
              🗑 Delete
            </Button>
          )}
        </div>
      </div>

      {/* Settings Switches */}
      <Form.Check
        type="switch"
        id="showLogo"
        label="Show Logo on Invoice"
        checked={settings.show_logo}
        onChange={(e) =>
          setSettings({ ...settings, show_logo: e.target.checked })
        }
      />

      <Form.Check
        type="switch"
        id="showQR"
        label="Show UPI QR Code"
        checked={settings.show_qr}
        onChange={(e) =>
          setSettings({ ...settings, show_qr: e.target.checked })
        }
      />

      {/* 🆕 UPI ID Field */}
      <Form.Group className="mt-3">
        <Form.Label>UPI ID</Form.Label>
        <Form.Control
          type="text"
          placeholder="example@upi"
          value={settings.upi || ""}
          onChange={(e) => setSettings({ ...settings, upi: e.target.value })}
        />
      </Form.Group>


      {/* Footer Note */}
      <Form.Group className="mt-3">
        <Form.Label>Footer Note</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={settings.footer_note || ""}
          onChange={(e) =>
            setSettings({ ...settings, footer_note: e.target.value })
          }
        />
      </Form.Group>

      {/* Signature Text */}
      <Form.Group className="mt-3">
        <Form.Label>Signature Text</Form.Label>
        <Form.Control
          value={settings.signature_text || ""}
          onChange={(e) =>
            setSettings({ ...settings, signature_text: e.target.value })
          }
        />
      </Form.Group>

      <div className="text-end mt-4">
        <Button variant="success" onClick={handleSaveSettings} disabled={saving}>
          💾 Save Settings
        </Button>
      </div>
    </Card>
  );
}

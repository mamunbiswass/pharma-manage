import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Card, Button, Form, Image, Spinner, Toast, ToastContainer } from "react-bootstrap";

export default function InvoiceSettings() {
  const [settings, setSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  // ✅ Toast Helper
  const showToast = (message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast({ show: false, message: "", variant: "success" }), 3500);
  };

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await API.get("/invoice-settings");
        setSettings(res.data);
      } catch (err) {
        console.error("Failed to load invoice settings:", err);
        showToast("❌ Failed to load invoice settings!", "danger");
      }
    }
    fetchSettings();
  }, []);

  const handleLogoUpload = async () => {
    if (!logoFile) return showToast("Please select a logo file first!", "warning");
    const formData = new FormData();
    formData.append("logo", logoFile);

    try {
      setSaving(true);
      const res = await API.post("/invoice-settings/upload-logo", formData);
      setSettings((prev) => ({ ...prev, logo: res.data.filename }));
      showToast("✅ Logo uploaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to upload logo!", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await API.put("/invoice-settings", settings);
      showToast("✅ Settings saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to save settings!", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings.logo) return showToast("No logo to delete!", "warning");
    if (!window.confirm("Delete logo permanently?")) return;
    try {
      await API.delete(`/invoice-settings/logo/${settings.logo}`);
      setSettings({ ...settings, logo: null });
      showToast("✅ Logo deleted successfully!", "success");
    } catch (err) {
      showToast("❌ Logo deletion failed!", "danger");
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
    <>
      <Card className="p-4 mt-4 shadow-sm">
        <h4 className="fw-bold mb-3">🧾 Invoice Settings</h4>

        {/* Logo Section */}
        <div className="mb-3">
          <Form.Label>Business Logo</Form.Label>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {settings.logo ? (
              <Image
                src={`http://localhost:5000/uploads/logo/${settings.logo}`}
                height={80}
                rounded
                className="border p-1"
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

      {/* ✅ Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          bg={toast.variant}
          onClose={() => setToast({ show: false })}
          delay={3500}
          autohide
        >
          <Toast.Body className="text-white fw-semibold">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

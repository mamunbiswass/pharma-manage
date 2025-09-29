import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Form, Toast } from "react-bootstrap";
import API from "../api/axios";
import useToast from "../hooks/useToast";

function ProfilePage() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    address: "",
  });
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null); // file
  const [editing, setEditing] = useState(false);

  // Toast hook
  const { toast, showToast, hideToast } = useToast();

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const res = await API.get("/profile"); // GET profile info
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
      showToast("Failed to load profile", "danger");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("phone", user.phone);
      formData.append("address", user.address);
      if (password.trim()) {
        formData.append("password", password);
      }
      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      await API.put("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditing(false);
      setPassword("");
      setProfilePic(null);
      showToast("Profile updated successfully!", "success");
      fetchProfile();
    } catch (err) {
      console.error("Failed to update profile", err);
      showToast("Failed to update profile", "danger");
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h4 className="mb-0">My Profile</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="text-center">
              <img
                src={user.profilePic || "https://via.placeholder.com/150"}
                alt="Profile"
                className="rounded-circle mb-3"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              {editing && (
                <Form.Group controlId="profilePic" className="mb-3">
                  <Form.Control type="file" onChange={handleFileChange} />
                </Form.Group>
              )}
              <Button
                variant={editing ? "secondary" : "primary"}
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel Edit" : "Edit Profile"}
              </Button>
            </Col>

            <Col md={8}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={user.phone}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="address"
                    value={user.address}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Form.Group>

                {editing && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                      />
                    </Form.Group>
                    <Button variant="success" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </>
                )}
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Toast
        onClose={hideToast}
        show={toast.show}
        delay={3000}
        autohide
        bg={toast.bg}
        className="position-fixed top-0 end-0 m-3"
      >
        <Toast.Header>
          <strong className="me-auto">
            {toast.bg === "success" ? "Success" : "Error"}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>
    </Container>
  );
}

export default ProfilePage;

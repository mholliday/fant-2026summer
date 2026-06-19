import React, { useRef, useState } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAPI } from "../contexts/AppContext";

const ResetPassword = ({ admin = false }) => {
  const passwordRef = useRef();
  const confirmRef = useRef();
  const { api } = useAPI();
  const { uid } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordRef.current.value !== confirmRef.current.value) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);
      if (admin && uid) {
        // Admin resetting another user's password
        await api.user.updateUser({ userID: uid, password: passwordRef.current.value });
      } else {
        await api.user.resetPass(passwordRef.current.value);
      }
      setMessage("Password updated successfully");
      setTimeout(() => navigate("/dash"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <Card.Body>
          <h2 className="mb-4 text-center">
            {admin ? "Reset User Password" : "Change Password"}
          </h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>New Password</Form.Label>
              <Form.Control type="password" ref={passwordRef} required />
              <Form.Text className="text-muted">
                Must contain uppercase, lowercase, digit, special character, min 8 chars
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control type="password" ref={confirmRef} required />
            </Form.Group>
            <Button disabled={loading} className="w-100" type="submit">
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResetPassword;

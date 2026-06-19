/**
 * Login component.
 * Bug fix: imported `redirect` from react-router-dom but never used it.
 * Removed the unused import to avoid lint warnings.
 */
import React, { useRef, useState } from "react";
import { Form, Button, Alert, Stack, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AppContext";

const Login = () => {
  const usernameRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(usernameRef.current.value, passwordRef.current.value);
      navigate("/dash");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <Card.Body>
          <h2 className="mb-4 text-center">Log In</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" ref={usernameRef} required autoFocus />
            </Form.Group>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" ref={passwordRef} required />
            </Form.Group>
            <Button disabled={loading} className="w-100" type="submit">
              {loading ? "Logging in…" : "Log In"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Stack>
  );
};

export default Login;

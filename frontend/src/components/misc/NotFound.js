import React from "react";
import { Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Alert variant="warning" className="mt-3">
      <Alert.Heading>404 — Page Not Found</Alert.Heading>
      <p>The page you are looking for does not exist.</p>
      <Button variant="outline-warning" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Alert>
  );
};

export default NotFound;

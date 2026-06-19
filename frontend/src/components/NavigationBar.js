import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AppContext";

const NavigationBar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          FANT
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          {user && (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dash">Dashboard</Nav.Link>
              {isAdmin && (
                <Nav.Link as={Link} to="/admin-panel">Admin Panel</Nav.Link>
              )}
            </Nav>
          )}
          <Nav className="ms-auto">
            {user ? (
              <>
                <Navbar.Text className="me-2">
                  {user.firstName} {user.lastName}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Log Out
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Log In</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;

import React from "react";
import { Card } from "react-bootstrap";

const Landing = () => {
  return (
    <Card>
      <Card.Header>
        <h1>FANT</h1>
        <h5>The Future of Cadaver Tracking</h5>
      </Card.Header>
      <Card.Body>
        <Card.Title>
          Database application for the Forensic Osteology Research Station (FOREST)
        </Card.Title>
      </Card.Body>
    </Card>
  );
};

export default Landing;

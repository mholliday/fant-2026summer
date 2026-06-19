import React from "react";
import { Alert } from "react-bootstrap";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>Something went wrong</Alert.Heading>
          <p>{this.state.error?.message ?? "An unexpected error occurred."}</p>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

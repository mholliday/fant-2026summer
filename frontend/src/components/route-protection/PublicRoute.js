import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AppContext";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dash" replace /> : children;
};

export default PublicRoute;

/**
 * PrivateRoute — redirects to /login if not authenticated.
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AppContext";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

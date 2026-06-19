/**
 * ProtectedRoute — checks read/write/admin permissions.
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AppContext";
import { canAccess } from "../../utilities/permissions";

const ProtectedRoute = ({ children, needRead = false, needWrite = false, needAdmin = false }) => {
  const { user } = useAuth();
  const access = user?.access ?? 0;

  if (!canAccess(needRead, needWrite, needAdmin, access)) {
    return <Navigate to="/dash" replace />;
  }

  return children;
};

export default ProtectedRoute;

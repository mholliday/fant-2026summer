import "./App.css";
import React from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";

import NavigationBar from "./components/NavigationBar";
import Dashboard from "./components/Dashboard";
import ModifyDonor from "./components/ModifyDonor";
import NotFound from "./components/misc/NotFound";
import ErrorBoundary from "./components/misc/ErrorHandling";
import Login from "./components/Login";
import { StateProvider } from "./contexts/AppContext";
import PrivateRoute from "./components/route-protection/PrivateRoute";
import ProtectedRoute from "./components/route-protection/ProtectedRoute";
import AdminPanel from "./components/AdminPanel";
import DonorView from "./components/DonorView";
import ResetPassword from "./components/ResetPassword";
import Landing from "./components/Landing";
import PublicRoute from "./components/route-protection/PublicRoute";
import { ThemeProvider } from "react-bootstrap";

function App() {
  return (
    <StateProvider>
      <ThemeProvider minBreakpoint="lg">
        <Router>
          <NavigationBar />
          <div className="container mt-3">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
                <Route
                  path="/dash"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/donor/create"
                  element={
                    <PrivateRoute>
                      <ProtectedRoute needWrite={true}>
                        <ModifyDonor key="create" create />
                      </ProtectedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/donor/:did"
                  element={
                    <PrivateRoute>
                      <ProtectedRoute needRead={true}>
                        <DonorView />
                      </ProtectedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/donor/update/:did"
                  element={
                    <PrivateRoute>
                      <ProtectedRoute needWrite={true}>
                        <ModifyDonor key="update" />
                      </ProtectedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin-panel"
                  element={
                    <PrivateRoute>
                      <ProtectedRoute needAdmin={true}>
                        <AdminPanel />
                      </ProtectedRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PrivateRoute>
                      <ResetPassword />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reset-user-password/:uid"
                  element={
                    <PrivateRoute>
                      <ProtectedRoute needAdmin={true}>
                        <ResetPassword admin={true} />
                      </ProtectedRoute>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </div>
        </Router>
      </ThemeProvider>
    </StateProvider>
  );
}

export default App;

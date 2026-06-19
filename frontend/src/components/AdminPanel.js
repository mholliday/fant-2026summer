import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, Stack, Alert, Spinner, Modal, Form, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAPI } from "../contexts/AppContext";
import { accessLevelToString } from "../utilities/permissions";

const AdminPanel = () => {
  const { api } = useAPI();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", username: "", password: "", access: 0,
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const restoreInputRef = useRef(null);
  const [backingUp, setBackingUp]   = useState(false);
  const [restoring, setRestoring]   = useState(false);
  const [dbMessage, setDbMessage]   = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.user.getAll();
      setUsers(res.data.users ?? []);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (userID, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.user.deleteUser(userID);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Delete failed");
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await api.user.createUser(createForm);
      setShowCreate(false);
      setCreateForm({ firstName: "", lastName: "", username: "", password: "", access: 0 });
      fetchUsers();
    } catch (err) {
      setCreateError(err?.response?.data?.message ?? "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    setDbMessage("");
    try {
      const res = await api.admin.backup();
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers["content-disposition"]
        ?.match(/filename="(.+)"/)?.[1] ?? "bonesdb-backup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setDbMessage("Backup downloaded successfully.");
    } catch (err) {
      setDbMessage(err?.response?.data?.message ?? "Backup failed");
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (!window.confirm("Restoring will REPLACE all current data. Are you sure?")) return;
    setRestoring(true);
    setDbMessage("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await api.admin.restore(data);
      const c = res.data.counts;
      setDbMessage(`Restore complete: ${c.donors} donors, ${c.versions} versions, ${c.users} users.`);
    } catch (err) {
      setDbMessage(err?.response?.data?.message ?? "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner /></div>;

  return (
    <div>
      <Stack direction="horizontal" className="mb-3">
        <h2 className="me-auto">Admin Panel</h2>
        <Button onClick={() => setShowCreate(true)}>+ New User</Button>
      </Stack>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

      {dbMessage && (
        <Alert variant={dbMessage.startsWith("Restore complete") || dbMessage.startsWith("Backup downloaded") ? "success" : "danger"}
               dismissible onClose={() => setDbMessage("")}>
          {dbMessage}
        </Alert>
      )}
      <Stack direction="horizontal" gap={2} className="mb-3">
        <Button variant="outline-primary" onClick={handleBackup} disabled={backingUp}>
          {backingUp ? "Backing up…" : "Backup Database"}
        </Button>
        <Button variant="outline-warning" onClick={() => restoreInputRef.current?.click()} disabled={restoring}>
          {restoring ? "Restoring…" : "Restore from Backup"}
        </Button>
        <input
          ref={restoreInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleRestoreFile}
        />
      </Stack>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Access Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userID}>
              <td>{u.firstName} {u.lastName}</td>
              <td>{u.username}</td>
              <td>
                <code>{accessLevelToString(u.access)}</code>{" "}
                <Badge bg="secondary" className="ms-1">{u.access}</Badge>
              </td>
              <td>
                <Stack direction="horizontal" gap={2}>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={() => navigate(`/reset-user-password/${u.userID}`)}
                  >
                    Reset Password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDelete(u.userID, `${u.firstName} ${u.lastName}`)}
                  >
                    Delete
                  </Button>
                </Stack>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Create User Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body>
            {createError && <Alert variant="danger">{createError}</Alert>}
            <div className="row g-2">
              {[
                ["First Name", "firstName", "text"],
                ["Last Name", "lastName", "text"],
                ["Username", "username", "text"],
                ["Password", "password", "password"],
              ].map(([label, field, type]) => (
                <div className="col-md-6" key={field}>
                  <Form.Group>
                    <Form.Label>{label}</Form.Label>
                    <Form.Control
                      type={type}
                      value={createForm[field]}
                      onChange={(e) => setCreateForm(f => ({ ...f, [field]: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </div>
              ))}
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Access Level (0–7)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={7}
                    value={createForm.access}
                    onChange={(e) => setCreateForm(f => ({ ...f, access: parseInt(e.target.value, 10) }))}
                  />
                  <Form.Text className="text-muted">
                    Bit flags: bit3=immutable, bit2=read, bit1=write, bit0=admin
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create User"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;

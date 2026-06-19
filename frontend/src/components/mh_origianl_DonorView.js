import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Stack, Spinner, Alert, Badge } from "react-bootstrap";
import { useAuth, useAPI } from "../contexts/AppContext";

const DonorView = () => {
  const { did } = useParams();
  const [donor, setDonor] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const { canWrite, isAdmin } = useAuth();
  const { api } = useAPI();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [donorRes, versionsRes] = await Promise.all([
          api.donor.getByDid(did),
          api.donor.getVersions(did),
        ]);
        setDonor(donorRes.data.donor);
        setVersions(versionsRes.data.versionsList ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load donor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api, did]);

  const handleArchive = async () => {
    try {
      await api.donor.archiveDonor(did);
      setActionMsg("Donor archived");
      navigate("/dash");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Archive failed");
    }
  };

  const handleRestore = async () => {
    try {
      await api.donor.restoreArchived(did);
      setActionMsg("Donor restored");
      navigate("/dash");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Restore failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this donor? This cannot be undone.")) return;
    try {
      await api.donor.deleteDonor(did);
      navigate("/dash");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Delete failed");
    }
  };

  const handleRestoreVersion = async (vid) => {
    if (!window.confirm("Restore to this version? Newer versions will be deleted.")) return;
    try {
      await api.donor.restoreVersion(vid);
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Version restore failed");
    }
  };

  const handleGetPDF = async () => {
    try {
      const res = await api.donor.getPDF(did);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${did}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("PDF generation failed");
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner /></div>;
  if (!donor) return <Alert variant="warning">Donor not found.</Alert>;

  const id = donor.data?.identification ?? {};

  return (
    <div>
      <Stack direction="horizontal" className="mb-3" gap={2}>
        <h2 className="me-auto">
          Donor {donor.donorID}
          {donor.archived && <Badge bg="secondary" className="ms-2">Archived</Badge>}
        </h2>
        {canWrite && !donor.archived && (
          <>
            <Button variant="outline-primary" onClick={() => navigate(`/donor/update/${did}`)}>
              Edit
            </Button>
            <Button variant="outline-warning" onClick={handleArchive}>Archive</Button>
          </>
        )}
        {isAdmin && donor.archived && (
          <>
            <Button variant="outline-success" onClick={handleRestore}>Restore</Button>
            <Button variant="outline-danger" onClick={handleDelete}>Delete Permanently</Button>
          </>
        )}
        <Button variant="outline-secondary" onClick={handleGetPDF}>Export PDF</Button>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>Back</Button>
      </Stack>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionMsg && <Alert variant="success">{actionMsg}</Alert>}

      <div className="row">
        <div className="col-md-6">
          <h5>Identification</h5>
          <table className="table table-sm table-bordered">
            <tbody>
              {Object.entries(id).map(([k, v]) => (
                <tr key={k}>
                  <td className="fw-semibold text-capitalize">{k.replace(/_/g, " ")}</td>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col-md-6">
          <h5>Metadata</h5>
          <table className="table table-sm table-bordered">
            <tbody>
              <tr><td className="fw-semibold">Created By</td><td>{donor.createdBy}</td></tr>
              <tr><td className="fw-semibold">Created</td><td>{new Date(donor.creationTime).toLocaleString()}</td></tr>
              <tr><td className="fw-semibold">Last Modified By</td><td>{donor.modifiedBy}</td></tr>
              <tr><td className="fw-semibold">Last Modified</td><td>{donor.modificationTime ? new Date(donor.modificationTime).toLocaleString() : "-"}</td></tr>
              <tr><td className="fw-semibold">Versions</td><td>{donor.numVersions}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {versions.length > 1 && (
        <>
          <h5 className="mt-4">Version History</h5>
          <table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>Version ID</th>
                <th>Modified By</th>
                <th>Date</th>
                <th>Changes</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {versions.map((v, i) => (
                <tr key={v.versionID}>
                  <td><code>{v.versionID.slice(-8)}</code></td>
                  <td>{v.modifiedBy}</td>
                  <td>{new Date(v.modificationTime).toLocaleString()}</td>
                  <td>{Object.keys(v.diffs ?? {}).length} field(s)</td>
                  {isAdmin && (
                    <td>
                      {i !== 0 && (
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={() => handleRestoreVersion(v.versionID)}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DonorView;

/**
 * Dashboard — shows all donors with pagination and search.
 * Preserves original structure; key changes:
 *  - Uses proper archived=false string for query (backend bug was fixed too)
 *  - Adds error state handling
 */
import React, { useState, useEffect, useCallback } from "react";
import { Button, Container, Stack, Spinner, Alert, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth, useAPI } from "../contexts/AppContext";

const Dashboard = () => {
  const [donors, setDonors] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  // `searchInput` is the live text box; `query` is the submitted term we fetch on.
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const { canWrite, isAdmin } = useAuth();
  const { api } = useAPI();
  const navigate = useNavigate();
  const donorsPerPage = 10;

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = showArchive
        ? await api.donor.getArchive(page, query)
        : await api.donor.getAll(page, donorsPerPage, query);
      setDonors(res.data.donors ?? []);
      setTotalResults(res.data.total_results ?? 0);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load donors");
    } finally {
      setLoading(false);
    }
  }, [api, page, showArchive, query]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setPage(0);
    setSearchInput("");
    setQuery("");
  };

  useEffect(() => { fetchDonors(); }, [fetchDonors]);

  return (
    <Container>
      <Stack direction="horizontal" className="mb-3" gap={2}>
        <h2 className="me-auto">{showArchive ? "Archive" : "Dashboard"}</h2>
        {canWrite && !showArchive && (
          <Button onClick={() => navigate("/donor/create")}>+ New Donor</Button>
        )}
        <Button variant="outline-secondary" onClick={() => { setShowArchive(!showArchive); setPage(0); }}>
          {showArchive ? "Back to Dashboard" : "View Archive"}
        </Button>
      </Stack>

      <Form onSubmit={submitSearch} className="mb-3">
        <Stack direction="horizontal" gap={2}>
          <Form.Control
            type="search"
            placeholder="Search donor text (e.g. Exemplars Used, notes, ancestry)…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="primary">Search</Button>
          {query && (
            <Button type="button" variant="outline-secondary" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </Stack>
      </Form>

      {query && (
        <div className="text-muted small mb-2">
          Showing {showArchive ? "archived " : ""}donors matching “{query}”.
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center mt-5"><Spinner /></div>
      ) : donors.length === 0 ? (
        <Alert variant="info">No donors found.</Alert>
      ) : (
        <>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Donor ID</th>
                <th>Created By</th>
                <th>Last Modified</th>
                <th>Modified By</th>
                <th>Versions</th>
                {isAdmin && showArchive && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {donors.map((donor) => (
                <tr
                  key={donor.donorID}
                  onClick={() => navigate(`/donor/${donor.donorID}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{donor.donorID}</td>
                  <td>{donor.createdBy}</td>
                  <td>{donor.modificationTime ? new Date(donor.modificationTime).toLocaleDateString() : "-"}</td>
                  <td>{donor.modifiedBy}</td>
                  <td>{donor.numVersions}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Stack direction="horizontal" gap={2} className="justify-content-center">
            <Button variant="outline-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span>Page {page + 1} of {Math.ceil(totalResults / donorsPerPage) || 1}</span>
            <Button
              variant="outline-secondary"
              disabled={(page + 1) * donorsPerPage >= totalResults}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </Stack>
        </>
      )}
    </Container>
  );
};

export default Dashboard;

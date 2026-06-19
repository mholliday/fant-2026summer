/**
 * ModifyDonor — create or update a donor record.
 * Works in two modes: create (props.create=true) or update (reads existing donor).
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Spinner, Alert, Card, Stack } from "react-bootstrap";
import { useAPI } from "../contexts/AppContext";
import { toDBSchema } from "../services/donorDataService";

// Returns a fresh default donor data structure
const defaultDonorData = () => ({
  identification: {
    ancestry: "",
    sex: "male",
    age: "",
    autopsy: false,
    condition: "good",
  },
  skeleton: {
    cranial: {},
    upper_limbs: {},
    lower_limbs: {},
    thorax: {},
    other: {},
  },
  dentition: { teeth: Array(32).fill("N") },
  osteometry: {},
  notes: {
    general_observations: "",
    trauma_and_pathological_analysis: "",
  },
});

const ModifyDonor = ({ create = false }) => {
  const { did } = useParams();
  const { api } = useAPI();
  const navigate = useNavigate();

  const [donorData, setDonorData] = useState(defaultDonorData());
  const [donorID, setDonorID] = useState("");
  const [loading, setLoading] = useState(!create);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (create) {
      // Pre-fetch the next available donor ID
      api.donor.getNextID().then((res) => setDonorID(res.data.nextID)).catch(console.error);
      return;
    }
    // Load existing donor for editing
    const load = async () => {
      try {
        const res = await api.donor.getByDid(did);
        const d = res.data.donor;
        setDonorID(d.donorID);
        setDonorData(d.data ?? defaultDonorData());
      } catch (err) {
        setError("Failed to load donor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api, create, did]);

  const handleIdentChange = (field, value) => {
    setDonorData((prev) => ({
      ...prev,
      identification: { ...prev.identification, [field]: value },
    }));
  };

  const handleNotesChange = (field, value) => {
    setDonorData((prev) => ({
      ...prev,
      notes: { ...prev.notes, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = toDBSchema(donorID, donorData);
      if (create) {
        await api.donor.createDonor(payload);
      } else {
        await api.donor.updateDonor(payload);
      }
      navigate(`/donor/${donorID}`);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner /></div>;

  const id = donorData.identification;
  const notes = donorData.notes;

  return (
    <div>
      <Stack direction="horizontal" className="mb-3">
        <h2 className="me-auto">{create ? "New Donor" : `Edit Donor ${donorID}`}</h2>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>Cancel</Button>
      </Stack>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Card className="mb-3">
          <Card.Header><strong>Donor ID</strong></Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label>ID</Form.Label>
              <Form.Control
                value={donorID}
                onChange={(e) => setDonorID(e.target.value)}
                readOnly={!create}
                required
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header><strong>Identification</strong></Card.Header>
          <Card.Body>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Ancestry</Form.Label>
                  <Form.Select value={id.ancestry} onChange={(e) => handleIdentChange("ancestry", e.target.value)}>
                    {["white", "african", "asian", "european", "hispanic", "native american", "oceanian"].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Sex</Form.Label>
                  <Form.Select value={id.sex} onChange={(e) => handleIdentChange("sex", e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={150}
                    value={id.age}
                    onChange={(e) => handleIdentChange("age", e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Condition</Form.Label>
                  <Form.Select value={id.condition} onChange={(e) => handleIdentChange("condition", e.target.value)}>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mt-4">
                  <Form.Check
                    type="checkbox"
                    label="Autopsy performed"
                    checked={!!id.autopsy}
                    onChange={(e) => handleIdentChange("autopsy", e.target.checked)}
                  />
                </Form.Group>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header><strong>Notes</strong></Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>General Observations</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes.general_observations}
                onChange={(e) => handleNotesChange("general_observations", e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Trauma and Pathological Analysis</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes.trauma_and_pathological_analysis}
                onChange={(e) => handleNotesChange("trauma_and_pathological_analysis", e.target.value)}
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end gap-2 mb-4">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : (create ? "Create Donor" : "Save Changes")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ModifyDonor;

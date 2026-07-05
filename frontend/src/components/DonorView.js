import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Stack, Spinner, Alert, Badge, Card, Table, Collapse, Tabs, Tab } from "react-bootstrap";
import { useAuth, useAPI } from "../contexts/AppContext";
import { ANALYSIS_FIELDS, ELEMENT_GROUPS, elemKey } from "../services/williamsForm";
import skeletalHomunculusImg from "../assets/skeletal_inventory_homunculus.png";
import traumaHomunculusImg from "../assets/trauma_homunculus.png";

// Osteometry order follows the Williams numbered list; measurements not on the
// form are kept but appended at the end of their bone group.
const OSTEOMETRY_FIELDS = {
  cranium: [
    { key: "maximum_cranial_length",     label: "Maximum Cranial Length (GOL)",          unit: "mm" },
    { key: "maximum_cranial_breadth",    label: "Maximum Cranial Breadth (XCB)",         unit: "mm" },
    { key: "bizygomatic_breadth",        label: "Bizygomatic Diameter (ZYB)",             unit: "mm" },
    { key: "basion_bregma_height",       label: "Basion-Bregma Height (BBH)",            unit: "mm" },
    { key: "cranial_base_length",        label: "Cranial Base Length (BNL)",             unit: "mm" },
    { key: "basion_prosthion_length",    label: "Basion-Prosthion Length (BPL)",         unit: "mm" },
    { key: "maxilloalveolar_breadth",    label: "Maxillo-Alveolar Breadth (MAB)",        unit: "mm" },
    { key: "maxilloalveolar_length",     label: "Maxillo-Alveolar Length (MAL)",         unit: "mm" },
    { key: "biauricular_breadth",        label: "Biauricular Breadth (AUB)",             unit: "mm" },
    { key: "upper_facial_height",        label: "Upper Facial Height (UFHT)",            unit: "mm" },
    { key: "min_frontal_breadth",        label: "Minimum Frontal Breadth (WFB)",         unit: "mm" },
    { key: "upper_facial_breadth",       label: "Upper Facial Breadth (UFBR)",           unit: "mm" },
    { key: "nasal_height",               label: "Nasal Height (NLH)",                    unit: "mm" },
    { key: "nasal_breadth",              label: "Nasal Breadth (NLB)",                   unit: "mm" },
    { key: "orbital_breadth",            label: "Orbital Breadth (OBB)",                 unit: "mm" },
    { key: "orbital_height",             label: "Orbital Height (OBH)",                  unit: "mm" },
    { key: "biorbital_breadth",          label: "Biorbital Breadth (EKB)",               unit: "mm" },
    { key: "interorbital_breadth",       label: "Interorbital Breadth (DKB)",            unit: "mm" },
    { key: "frontal_chord",              label: "Frontal Chord (FRC)",                   unit: "mm" },
    { key: "parietal_chord",             label: "Parietal Chord (PAC)",                  unit: "mm" },
    { key: "occipital_chord",            label: "Occipital Chord (OCC)",                 unit: "mm" },
    { key: "foramen_magnum_length",      label: "Foramen Magnum Length (FOL)",           unit: "mm" },
    { key: "foramen_magnum_breadth",     label: "Foramen Magnum Breadth (FOB)",          unit: "mm" },
    { key: "mastoid_length",             label: "Mastoid Length (MDH)",                  unit: "mm" },
  ],
  mandible: [
    { key: "chin_height",                label: "Chin Height (GNI)",                     unit: "mm" },
    { key: "mandibular_body_height",     label: "Height of Mandibular Body (HMF)",       unit: "mm" },
    { key: "mandibular_body_breadth",    label: "Breadth of Mandibular Body (TMF)",      unit: "mm" },
    { key: "bigonial_breadth",           label: "Bigonial Width (GOG)",                unit: "mm" },
    { key: "bicondylar_breadth",         label: "Bicondylar Breadth (CDB)",              unit: "mm" },
    { key: "min_ramus_breadth",          label: "Minimum Ramus Breadth (WRB)",           unit: "mm" },
    { key: "max_ramus_breadth",          label: "Maximum Ramus Breadth (XRB)",           unit: "mm" },
    { key: "mandible_length",            label: "Mandible Length",                       unit: "mm" },
    { key: "symphysis_height",           label: "Symphysis Height",                      unit: "mm" },
    { key: "ramus_height",               label: "Ramus Height",                          unit: "mm" },
  ],
  clavicle: [
    { key: "clavicle_max_length",        label: "Maximum Length (XLN)",                  unit: "mm" },
    { key: "clavicle_ap_diameter",       label: "Ant.-Post. Diameter at Midshaft (APD)", unit: "mm" },
    { key: "clavicle_si_diameter",       label: "Sup.-Inf. Diameter at Midshaft (VRD)",  unit: "mm" },
  ],
  scapula: [
    { key: "scapula_height",             label: "Anatomical Height (PHT)",               unit: "mm" },
    { key: "scapula_breadth",            label: "Anatomical Breadth (PBR)",              unit: "mm" },
    { key: "glenoid_height",             label: "Glenoid Cavity Height",                 unit: "mm" },
    { key: "glenoid_breadth",            label: "Glenoid Cavity Breadth",                unit: "mm" },
  ],
  humerus: [
    { key: "humerus_max_length",         label: "Maximum Length (XLN)",                  unit: "mm" },
    { key: "humerus_epicondylar_width",  label: "Epicondylar Breadth (EBR)",             unit: "mm" },
    { key: "humerus_head_diameter",      label: "Vertical Diameter of Head (HDD)",                   unit: "mm" },
    { key: "humerus_max_diam_midshaft",  label: "Maximum Diameter at Midshaft (MXD)",    unit: "mm" },
    { key: "humerus_min_diam_midshaft",  label: "Minimum Diameter at Midshaft (MWD)",    unit: "mm" },
  ],
  radius: [
    { key: "radius_max_length",          label: "Maximum Length (XLN)",                  unit: "mm" },
    { key: "radius_sagittal_diameter",   label: "Ant.-Post. Diameter at Midshaft (APD)", unit: "mm" },
    { key: "radius_transverse_diameter", label: "Med.-Lat. Diameter at Midshaft (TVD)",  unit: "mm" },
  ],
  ulna: [
    { key: "ulna_max_length",            label: "Maximum Length (XLN)",                  unit: "mm" },
    { key: "ulna_dorso_volar_diam",      label: "Dorso-Volar Diameter (DVD)",            unit: "mm" },
    { key: "ulna_transverse_diam",       label: "Transverse Diameter (TVD)",             unit: "mm" },
    { key: "ulna_physiological_length",  label: "Physiological Length",                  unit: "mm" },
  ],
  sacrum: [
    { key: "sacrum_ant_height",          label: "Anterior Height (AHT)",                 unit: "mm" },
    { key: "sacrum_ant_sup_breadth",     label: "Ant.-Sup. Breadth (ABR)",               unit: "mm" },
    { key: "sacrum_s1_breadth",          label: "Max. Trans. Diameter of Base S1 (S1B)", unit: "mm" },
  ],
  os_coxa: [
    { key: "os_coxa_height",             label: "Innominate Height (OHT)",               unit: "mm" },
    { key: "iliac_breadth",              label: "Iliac Breadth (ABR)",                   unit: "mm" },
    { key: "pubis_length",               label: "Pubis Length",                          unit: "mm" },
    { key: "ischium_length",             label: "Ischium Length",                        unit: "mm" },
  ],
  femur: [
    { key: "femur_max_length",           label: "Maximum Length (XLN)",                  unit: "mm" },
    { key: "femur_bicondylar_length",    label: "Bicondylar Length (BLN)",               unit: "mm" },
    { key: "femur_epicondylar_breadth",  label: "Epicondylar Breadth (EBR)",             unit: "mm" },
    { key: "femur_head_diameter",        label: "Maximum Diameter of Femoral Head (HDD)",                   unit: "mm" },
    { key: "femur_ap_subtrochanteric",   label: "Ant.-Post. Subtrochanteric Diameter (SAP)",    unit: "mm" },
    { key: "femur_ml_subtrochanteric",   label: "Med.-Lat. Subtrochanteric Diameter (STV)",    unit: "mm" },
    { key: "femur_ap_midshaft",          label: "Ant.-Post. Midshaft Diameter (MAP)",           unit: "mm" },
    { key: "femur_ml_midshaft",          label: "Med.-Lat. Midshaft Diameter (MTV)",           unit: "mm" },
    { key: "femur_midshaft_circ",        label: "Midshaft Circumference",                unit: "mm" },
    { key: "femur_bicondylar_width",     label: "Distal Bicondylar Width",               unit: "mm" },
  ],
  tibia: [
    { key: "tibia_max_length",           label: "Maximum Condylo-Malleolar Length* (XLN)",                  unit: "mm" },
    { key: "tibia_prox_epiphyseal",      label: "Maximum Prox. Epiphyseal Breadth (PEB)",   unit: "mm" },
    { key: "tibia_dist_epiphyseal",      label: "Maximum Dist. Epiphyseal Breadth (DEB)",   unit: "mm" },
    { key: "tibia_ap_nutrient_foramen",  label: "Maximum Diameter at Nutrient Foramen (NFX)",unit: "mm" },
    { key: "tibia_ml_nutrient_foramen",  label: "Max. Med.-Lat. Diameter at Nutrient Foramen (NFT)",unit: "mm" },
    { key: "tibia_midshaft_circ",        label: "Midshaft Circumference",                unit: "mm" },
    { key: "tibia_distal_breadth",       label: "Distal Breadth",                        unit: "mm" },
  ],
  fibula: [
    { key: "fibula_max_length",          label: "Maximum Length (XLN)",                  unit: "mm" },
    { key: "fibula_max_diam_midshaft",   label: "Maximum Diameter at Midshaft (MDM)",    unit: "mm" },
  ],
  calcaneus: [
    { key: "calcaneus_max_length",       label: "Maximum Length (CXL)",                  unit: "mm" },
    { key: "calcaneus_middle_breadth",   label: "Middle Breadth (CBR)",                  unit: "mm" },
  ],
  talus: [
    { key: "talus_max_length",           label: "Maximum Length",                        unit: "mm" },
    { key: "talus_max_breadth",          label: "Maximum Breadth",                       unit: "mm" },
  ],
};

const BONE_GROUP_LABELS = {
  cranium:   "Cranium",
  mandible:  "Mandible",
  clavicle:  "Clavicle",
  scapula:   "Scapula",
  humerus:   "Humerus",
  radius:    "Radius",
  ulna:      "Ulna",
  sacrum:    "Sacrum",
  os_coxa:   "Innominate (Pelvis)",
  femur:     "Femur",
  tibia:     "Tibia",
  fibula:    "Fibula",
  calcaneus: "Calcaneus",
  talus:     "Talus",
};

const CODE_LABELS = { "1": "1 (100%)", "2": "2 (75–99%)", "3": "3 (25–74%)", "4": "4 (<25%)", "5": "5 (absent)" };
const codeDisplay = (v) => v ? (CODE_LABELS[v] ?? v) : "—";

const SKULL_SINGLES   = ["frontal","occipital","ethmoid","vomer","sphenoid","mandible"];
const SKULL_BILATERAL = ["parietal","temporal","zygomatic","palatine","maxilla","nasal","lacrimal"];
const SKULL_LABELS    = { frontal:"Frontal", occipital:"Occipital", ethmoid:"Ethmoid", vomer:"Vomer", sphenoid:"Sphenoid", mandible:"Mandible", parietal:"Parietal", temporal:"Temporal", zygomatic:"Zygomatic", palatine:"Palatine", maxilla:"Maxilla", nasal:"Nasal", lacrimal:"Lacrimal" };
// Sacrum & Coccyx are shown within the Vertebrae section (per the SKELETAL PDF).
const AXIAL_SINGLES   = ["hyoid","manubrium","sternal_body","xiphoid"];
const AXIAL_LABELS    = { hyoid:"Hyoid", manubrium:"Manubrium", sternal_body:"Sternal Body", xiphoid:"Xiphoid", sacrum:"Sacrum", coccyx:"Coccyx" };
const GIRDLE_BILATERAL = ["clavicle","scapula","ischium","ilium","pubis"];
const GIRDLE_LABELS   = { clavicle:"Clavicle", scapula:"Scapula", ischium:"Ischium", ilium:"Ilium", pubis:"Pubis" };
const CARPAL_BONES    = ["scaphoid","lunate","triquetral","pisiform","hamate","capitate","trapezoid","trapezium"];
const CARPAL_LABELS   = { scaphoid:"Scaphoid", lunate:"Lunate", triquetral:"Triquetral", pisiform:"Pisiform", hamate:"Hamate", capitate:"Capitate", trapezoid:"Trapezoid", trapezium:"Trapezium" };
const TARSAL_BONES    = ["calcaneus","talus","navicular","cuboid","cuneiform1","cuneiform2","cuneiform3","patella"];
const TARSAL_LABELS   = { calcaneus:"Calcaneus", talus:"Talus", navicular:"Navicular", cuboid:"Cuboid", cuneiform1:"Cuneiform I", cuneiform2:"Cuneiform II", cuneiform3:"Cuneiform III", patella:"Patella" };
const LONG_BONES      = ["humerus","radius","ulna","femur","tibia","fibula"];
const LONG_LABELS     = { humerus:"Humerus", radius:"Radius", ulna:"Ulna", femur:"Femur", tibia:"Tibia", fibula:"Fibula" };

const DonorView = () => {
  const { did } = useParams();
  const [donor, setDonor] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [openGroups, setOpenGroups] = useState({});
  // Both tabs start closed; clicking a tab opens it, clicking the open tab closes it.
  const [activeTab, setActiveTab] = useState(null);
  // Each Element Inventory subsection (Cranium, Axial, …) is individually collapsible.
  const [elemOpen, setElemOpen] = useState({});
  const toggleElem = (key) => setElemOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const { canWrite, isAdmin } = useAuth();
  const { api } = useAPI();
  const navigate = useNavigate();

  const toggleGroup = (group) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

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
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${did}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError("PDF generation failed");
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner /></div>;
  if (!donor) return <Alert variant="warning">Donor not found.</Alert>;

  const id         = donor.data?.identification ?? {};
  const osteometry = donor.data?.osteometry ?? {};
  const notes      = donor.data?.notes ?? {};
  const skeleton   = donor.data?.skeleton ?? {};
  const teeth      = donor.data?.dentition?.teeth ?? Array(32).fill("N");
  const analysis   = donor.data?.analysis ?? {};
  const inventory  = donor.data?.element_inventory ?? {};
  const hasAnalysis  = ANALYSIS_FIELDS.some(f => analysis[f.key]);
  const hasInventory = Object.keys(inventory).length > 0;
  const refBase = `${(api?.url || "/api/v2/").replace(/\/$/, "")}/reference/`;

  const groupHasData = (fields) =>
    fields.some(({ key }) => osteometry[key] !== "" && osteometry[key] != null);

  const BoneCell = ({ val }) => (
    <span className={val ? "fw-semibold" : "text-muted"}>{codeDisplay(val)}</span>
  );

  // Read-only render of the Instruments/Equipment Used + Exemplars Used pair
  // that follows the Trauma, General Observations and Continuation boxes.
  const instrExemplarsView = (base) => {
    const instr = notes[`${base}_instruments`];
    const exemp = notes[`${base}_exemplars`];
    if (!instr && !exemp) return null;
    return (
      <div className="mt-2 small">
        {instr && <div><span className="fw-semibold">Instruments/Equipment Used (Type and ID#): </span><span style={{ whiteSpace: "pre-wrap" }}>{instr}</span></div>}
        {exemp && <div><span className="fw-semibold">Exemplars Used: </span><span style={{ whiteSpace: "pre-wrap" }}>{exemp}</span></div>}
      </div>
    );
  };

  // ---- Williams Analysis form ----------------------------------------------
  const williamsView = (
    <>
      {/* Analysis (Williams form header) — front of the Williams packet */}
      {hasAnalysis && (
        <div className="mb-3">
          <h5>Analysis</h5>
          <Table size="sm" bordered>
            <tbody>
              {ANALYSIS_FIELDS.filter(f => analysis[f.key]).map(f => (
                <tr key={f.key}>
                  <td className="fw-semibold" style={{ width: "30%" }}>{f.label}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{analysis[f.key]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Element Inventory (Present/Absent) + Skeletal Inventory Homunculus */}
      {hasInventory && (
        <div className="mb-4">
          <Card className="mb-2">
            <Card.Header onClick={() => toggleGroup("_inventory")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold">Element Inventory</span>
              <span className="text-muted">{openGroups["_inventory"] ? "▲" : "▼"}</span>
            </Card.Header>
          </Card>
          <Collapse in={!!openGroups["_inventory"]}>
            <div>
              {ELEMENT_GROUPS.map(group => (
                <Card key={group.key} className="mb-2">
                  <Card.Header
                    onClick={() => toggleElem(group.key)}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    className="py-2 fw-semibold small d-flex justify-content-between align-items-center"
                  >
                    <span>{group.label}</span>
                    <span className="text-muted">{elemOpen[group.key] ? "▲" : "▼"}</span>
                  </Card.Header>
                  <Collapse in={!!elemOpen[group.key]}>
                    <div>
                      <Card.Body className="p-0">
                        <Table size="sm" className="mb-0">
                          <tbody>
                            {group.elements.map(el => {
                              const cell = inventory[elemKey(group.key, el.key)] ?? { absent: false, obs: "" };
                              return (
                                <tr key={el.key}>
                                  <td className="small fw-semibold" style={{ width: "30%" }}>{el.label}</td>
                                  <td style={{ width: 90 }}>
                                    <Badge bg={cell.absent ? "secondary" : "success"}>{cell.absent ? "Absent" : "Present"}</Badge>
                                  </td>
                                  <td className="small text-muted">{cell.obs || ""}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              ))}
              {/* Skeletal Inventory Homunculus sits at the bottom of the section (per the form) */}
              <Card className="mb-2">
                <Card.Body className="text-center">
                  <img src={skeletalHomunculusImg} alt="Skeletal Inventory Homunculus" style={{ width: "100%", maxWidth: 700, height: "auto" }} />
                </Card.Body>
              </Card>
            </div>
          </Collapse>
        </div>
      )}

      {/* General Observations (first box) */}
      {notes.general_observations && (
        <Card className="mb-2">
          <Card.Header className="py-2 fw-semibold">General Observations</Card.Header>
          <Card.Body className="py-2" style={{ whiteSpace: "pre-wrap" }}>{notes.general_observations}</Card.Body>
        </Card>
      )}

      {/* Osteometry */}
      <h5 className="mt-3">Osteometry</h5>
      {Object.entries(OSTEOMETRY_FIELDS).map(([group, fields]) => {
        const hasData = groupHasData(fields);
        const isOpen = !!openGroups[group];
        const recordedCount = fields.filter(({ key }) => osteometry[key] !== "" && osteometry[key] != null).length;

        return (
          <Card key={group} className="mb-2">
            <Card.Header
              onClick={() => toggleGroup(group)}
              style={{ cursor: "pointer", userSelect: "none" }}
              className="py-2 d-flex justify-content-between align-items-center"
            >
              <span className="fw-semibold">{BONE_GROUP_LABELS[group]}</span>
              <span className="d-flex align-items-center gap-3">
                {hasData
                  ? <Badge bg="primary">{recordedCount} / {fields.length} recorded</Badge>
                  : <span className="text-muted small">No measurements recorded</span>
                }
                <span className="text-muted">{isOpen ? "▲" : "▼"}</span>
              </span>
            </Card.Header>
            <Collapse in={isOpen}>
              <div>
                <Card.Body className="p-2">
                  <div className="row g-2">
                    {fields.map(({ key, label, unit }) => {
                      const val = osteometry[key];
                      const hasVal = val !== "" && val != null;
                      return (
                        <div key={key} className="col-md-4 col-sm-6">
                          <div className={`border rounded px-2 py-1 ${hasVal ? "bg-light" : "bg-white text-muted"}`}>
                            <div className="small">{label}</div>
                            <div className={hasVal ? "fw-semibold" : "fst-italic small"}>
                              {hasVal ? <>{val} <span className="text-muted fw-normal">{unit}</span></> : "—"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </div>
            </Collapse>
          </Card>
        );
      })}

      {/* Trauma and Pathological Analysis */}
      {(notes.trauma_and_pathological_analysis || notes.trauma_instruments || notes.trauma_exemplars) && (
        <Card className="mb-2 mt-3">
          <Card.Header className="py-2 fw-semibold">Trauma and Pathological Analysis</Card.Header>
          <Card.Body className="py-2">
            {notes.trauma_and_pathological_analysis && <div style={{ whiteSpace: "pre-wrap" }}>{notes.trauma_and_pathological_analysis}</div>}
            {instrExemplarsView("trauma")}
          </Card.Body>
        </Card>
      )}

      {/* General Observations (second box) */}
      {(notes.general_observations_2 || notes.general_observations_2_instruments || notes.general_observations_2_exemplars) && (
        <Card className="mb-2">
          <Card.Header className="py-2 fw-semibold">General Observations</Card.Header>
          <Card.Body className="py-2">
            {notes.general_observations_2 && <div style={{ whiteSpace: "pre-wrap" }}>{notes.general_observations_2}</div>}
            {instrExemplarsView("general_observations_2")}
          </Card.Body>
        </Card>
      )}

      {/* Trauma and General Observations Homunculus */}
      <Card className="mb-2 mt-3">
        <Card.Body className="text-center">
          <img src={traumaHomunculusImg} alt="Trauma and General Observations Homunculus" style={{ width: "100%", maxWidth: 700, height: "auto" }} />
        </Card.Body>
      </Card>

      {/* Continuation to Skeletal Analysis */}
      {(notes.continuation || notes.continuation_instruments || notes.continuation_exemplars) && (
        <Card className="mb-2">
          <Card.Header className="py-2 fw-semibold">Continuation to Skeletal Analysis</Card.Header>
          <Card.Body className="py-2">
            {notes.continuation && <div style={{ whiteSpace: "pre-wrap" }}>{notes.continuation}</div>}
            {instrExemplarsView("continuation")}
          </Card.Body>
        </Card>
      )}
    </>
  );

  // ---- SKELETAL INVENTORY form ---------------------------------------------
  const skeletalView = (
    <>
      {/* Identification header (start of the SKELETAL INVENTORY form) */}
      <div className="mb-3">
        <h5>Identification <span className="text-muted fw-normal small">SKELETAL INVENTORY header</span></h5>
        <Table size="sm" bordered>
          <tbody>
            {Object.entries(id).map(([k, v]) => (
              <tr key={k}>
                <td className="fw-semibold text-capitalize" style={{ width: "45%" }}>{k.replace(/_/g, " ")}</td>
                <td>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Dentition */}
      <div className="mb-4">
        <Card className="mb-2">
          <Card.Header onClick={() => toggleGroup("_dentition")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center py-2">
            <span className="fw-semibold">Dentition</span>
            <span className="d-flex align-items-center gap-3">
              <span className="text-muted small">A=antemortem absence, P=postmortem absence, N=natural, D=dental work</span>
              <span className="text-muted">{openGroups["_dentition"] ? "▲" : "▼"}</span>
            </span>
          </Card.Header>
        </Card>
        <Collapse in={!!openGroups["_dentition"]}>
        <div>
          <p className="text-muted small mb-2 mt-1">A=antemortem absence, P=postmortem absence, N=natural, D=dental work</p>
          <Card className="mb-2">
            <Card.Header className="py-2 small fw-semibold">Upper jaw (teeth 1–16)</Card.Header>
            <Card.Body className="py-2">
              <div className="d-flex flex-wrap gap-2">
                {Array.from({ length: 16 }, (_, i) => (
                  <div key={i} className="text-center" style={{ minWidth: 40 }}>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>{i + 1}</div>
                    <Badge bg={teeth[i] === "N" ? "light" : teeth[i] === "A" ? "danger" : teeth[i] === "P" ? "warning" : "info"} text={teeth[i] === "N" ? "dark" : undefined}>
                      {teeth[i]}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header className="py-2 small fw-semibold">Lower jaw (teeth 17–32)</Card.Header>
            <Card.Body className="py-2">
              <div className="d-flex flex-wrap gap-2">
                {Array.from({ length: 16 }, (_, i) => (
                  <div key={i + 16} className="text-center" style={{ minWidth: 40 }}>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>{i + 17}</div>
                    <Badge bg={teeth[i+16] === "N" ? "light" : teeth[i+16] === "A" ? "danger" : teeth[i+16] === "P" ? "warning" : "info"} text={teeth[i+16] === "N" ? "dark" : undefined}>
                      {teeth[i + 16]}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
        </Collapse>
      </div>

      {/* Skeletal Inventory */}
      <div className="mb-4">
        <Card className="mb-2">
          <Card.Header onClick={() => toggleGroup("_skeleton")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center py-2">
            <span className="fw-semibold">Skeletal Inventory</span>
            <span className="d-flex align-items-center gap-3">
              <span className="text-muted small">Codes: 1=100%, 2=99–75%, 3=74–25%, 4=&lt;25%, 5=absent</span>
              <span className="text-muted">{openGroups["_skeleton"] ? "▲" : "▼"}</span>
            </span>
          </Card.Header>
        </Card>
        <Collapse in={!!openGroups["_skeleton"]}>
        <div>
          <p className="text-muted small mb-2 mt-1">Codes: 1=100% complete, 2=99–75%, 3=74–25%, 4=&lt;25%, 5=absent</p>

          {/* Cranial */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">Cranial</Card.Header>
            <Card.Body className="py-2">
              <Table size="sm" bordered className="mb-0">
                <tbody>
                  <tr>
                    {SKULL_SINGLES.map(k => (
                      <td key={k} className="text-center" style={{ minWidth: 80 }}>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{SKULL_LABELS[k]}</div>
                        <BoneCell val={skeleton[k]} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {SKULL_BILATERAL.map(k => (
                      <td key={k} className="text-center" style={{ minWidth: 80 }}>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{SKULL_LABELS[k]}</div>
                        <div className="small">L: <BoneCell val={skeleton[`${k}_l`]} /> / R: <BoneCell val={skeleton[`${k}_r`]} /></div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Axial */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">Axial</Card.Header>
            <Card.Body className="py-2">
              <div className="d-flex flex-wrap gap-3">
                {AXIAL_SINGLES.map(k => (
                  <div key={k} className="text-center">
                    <div className="text-muted small">{AXIAL_LABELS[k]}</div>
                    <BoneCell val={skeleton[k]} />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Shoulder / Pelvis */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">Shoulder Girdle / Pelvis</Card.Header>
            <Card.Body className="py-2">
              <div className="d-flex flex-wrap gap-3">
                {GIRDLE_BILATERAL.map(k => (
                  <div key={k} className="text-center">
                    <div className="text-muted small">{GIRDLE_LABELS[k]}</div>
                    <div className="small">L: <BoneCell val={skeleton[`${k}_l`]} /> / R: <BoneCell val={skeleton[`${k}_r`]} /></div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Long Bones */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">Long Bones</Card.Header>
            <Card.Body className="p-0">
              <Table size="sm" bordered className="mb-0">
                <thead>
                  <tr>
                    <th rowSpan={2}>Bone</th>
                    <th colSpan={3} className="text-center small">Left</th>
                    <th colSpan={3} className="text-center small">Right</th>
                  </tr>
                  <tr>
                    {["Overall","Prox.","Dist.","Overall","Prox.","Dist."].map((h,i) => (
                      <th key={i} className="small text-muted text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LONG_BONES.map(b => (
                    <tr key={b}>
                      <td className="small fw-semibold">{LONG_LABELS[b]}</td>
                      {["l","r"].map(side =>
                        ["", "_prox", "_dist"].map(suffix => (
                          <td key={`${side}${suffix}`} className="text-center small">
                            <BoneCell val={skeleton[`${b}_${side}${suffix}`]} />
                          </td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Carpal / Tarsal */}
          <div className="row g-2 mb-2">
            {[[CARPAL_BONES, CARPAL_LABELS, "Carpal (Wrist) Bones"], [TARSAL_BONES, TARSAL_LABELS, "Tarsal (Foot) Bones"]].map(([bones, labels, title]) => (
              <div key={title} className="col-md-6">
                <Card>
                  <Card.Header className="py-2 fw-semibold small">{title}</Card.Header>
                  <Card.Body className="py-2">
                    {/* CSS columns so bones read top-to-bottom (per the SKELETAL form) */}
                    <div style={{ columnCount: 2, columnGap: "0.75rem" }}>
                      {bones.map(k => (
                        <div key={k} className="small mb-1" style={{ breakInside: "avoid" }}>
                          <span className="text-muted">{labels[k]}: </span>
                          L:<BoneCell val={skeleton[`${k}_l`]} /> / R:<BoneCell val={skeleton[`${k}_r`]} />
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>

          {/* Metacarpals / Metatarsals */}
          <div className="row g-2 mb-2">
            {[["Metacarpals","mc"],["Metatarsals","mt"]].map(([label, prefix]) => (
              <div key={prefix} className="col-md-6">
                <Card>
                  <Card.Header className="py-2 fw-semibold small">{label}</Card.Header>
                  <Card.Body className="py-2">
                    <Table size="sm" bordered className="mb-0">
                      <thead><tr><th></th><th className="text-center small">Left</th><th className="text-center small">Right</th></tr></thead>
                      <tbody>
                        {[1,2,3,4,5].map(i => (
                          <tr key={i}>
                            <td className="small fw-semibold">{prefix.toUpperCase()}{i}</td>
                            <td className="text-center small"><BoneCell val={skeleton[`${prefix}${i}_l`]} /></td>
                            <td className="text-center small"><BoneCell val={skeleton[`${prefix}${i}_r`]} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>

          {/* Phalanges */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">Phalanges (counts)</Card.Header>
            <Card.Body className="p-0">
              <Table size="sm" bordered className="mb-0">
                <thead><tr><th>Hand</th><th className="text-center small">L</th><th className="text-center small">R</th><th>Foot</th><th className="text-center small">L</th><th className="text-center small">R</th></tr></thead>
                <tbody>
                  {[["Proximal","hand_prox","foot_prox"],["Middle","hand_middle","foot_middle"],["Distal","hand_distal","foot_distal"]].map(([lbl, hk, fk]) => (
                    <tr key={hk}>
                      <td className="small fw-semibold">{lbl}</td>
                      <td className="text-center small">{skeleton[`${hk}_l`] || "—"}</td>
                      <td className="text-center small">{skeleton[`${hk}_r`] || "—"}</td>
                      <td className="small fw-semibold">{lbl}</td>
                      <td className="text-center small">{skeleton[`${fk}_l`] || "—"}</td>
                      <td className="text-center small">{skeleton[`${fk}_r`] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Vertebrae */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">Vertebrae</Card.Header>
            <Card.Body className="py-2">
              {[
                { label: "Cervical", prefix: "c", count: "cervical_count", total: 7 },
                { label: "Thoracic", prefix: "t", count: "thoracic_count", total: 12 },
                { label: "Lumbar",   prefix: "l", count: "lumbar_count",   total: 5 },
              ].map(({ label, prefix, count, total }) => (
                <div key={prefix} className="mb-2">
                  <span className="small fw-semibold">{label}</span>
                  {skeleton[count] && <span className="text-muted small ms-2">(count: {skeleton[count]})</span>}
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {Array.from({ length: total }, (_, i) => i + 1).map(i => (
                      <div key={i} className="text-center" style={{ minWidth: 45 }}>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{prefix.toUpperCase()}{i}</div>
                        <BoneCell val={skeleton[`${prefix}${i}`]} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="d-flex flex-wrap gap-3 mt-2">
                <div className="text-center">
                  <div className="text-muted small">{AXIAL_LABELS.sacrum}</div>
                  <BoneCell val={skeleton.sacrum} />
                </div>
                <div className="text-center">
                  <div className="text-muted small">{AXIAL_LABELS.coccyx}</div>
                  <BoneCell val={skeleton.coccyx} />
                  {skeleton.coccyx_count && <span className="text-muted small ms-1">(#{skeleton.coccyx_count})</span>}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Ribs */}
          <Card className="mb-2">
            <Card.Header className="py-2 fw-semibold small">
              Ribs {skeleton.ribs_count && <span className="text-muted fw-normal">(count: {skeleton.ribs_count})</span>}
            </Card.Header>
            <Card.Body className="p-0">
              <Table size="sm" bordered className="mb-0">
                <thead><tr><th>Rib</th><th className="text-center small">Left</th><th className="text-center small">Right</th><th>Rib</th><th className="text-center small">Left</th><th className="text-center small">Right</th></tr></thead>
                <tbody>
                  {[1,2,3,4,5,6].map(i => (
                    <tr key={i}>
                      <td className="small fw-semibold">R{i}</td>
                      <td className="text-center small"><BoneCell val={skeleton[`rib${i}_l`]} /></td>
                      <td className="text-center small"><BoneCell val={skeleton[`rib${i}_r`]} /></td>
                      <td className="small fw-semibold">R{i+6}</td>
                      <td className="text-center small"><BoneCell val={skeleton[`rib${i+6}_l`]} /></td>
                      <td className="text-center small"><BoneCell val={skeleton[`rib${i+6}_r`]} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {skeleton.comments && (
            <Card className="mb-2">
              <Card.Header className="py-2 fw-semibold small">Comments / Notes</Card.Header>
              <Card.Body className="py-2" style={{ whiteSpace: "pre-wrap" }}>{skeleton.comments}</Card.Body>
            </Card>
          )}
        </div>
        </Collapse>
      </div>
    </>
  );

  return (
    <div>
      <Stack direction="horizontal" className="mb-3" gap={2}>
        <h2 className="me-auto">
          Donor {donor.donorID}
          {donor.archived && <Badge bg="secondary" className="ms-2">Archived</Badge>}
        </h2>
        {canWrite && !donor.archived && (
          <>
            <Button variant="outline-primary" onClick={() => navigate(`/donor/update/${did}`)}>Edit</Button>
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

      {/* Metadata (record housekeeping — shared across both forms) */}
      <div className="mb-3">
        <h5>Metadata</h5>
        <Table size="sm" bordered>
          <tbody>
            <tr><td className="fw-semibold" style={{ width: "45%" }}>Created By</td><td>{donor.createdBy}</td></tr>
            <tr><td className="fw-semibold">Created</td><td>{new Date(donor.creationTime).toLocaleString()}</td></tr>
            <tr><td className="fw-semibold">Last Modified By</td><td>{donor.modifiedBy}</td></tr>
            <tr><td className="fw-semibold">Last Modified</td><td>{donor.modificationTime ? new Date(donor.modificationTime).toLocaleString() : "—"}</td></tr>
            <tr><td className="fw-semibold">Versions</td><td>{donor.numVersions}</td></tr>
          </tbody>
        </Table>
      </div>

      {/* Reference Forms (blank originals) */}
      <div className="mb-3">
        <h5>Reference Forms</h5>
        <Stack direction="horizontal" gap={2}>
          <Button size="sm" variant="outline-secondary" href={`${refBase}skeletal-inventory.pdf`} target="_blank" rel="noreferrer">
            SKELETAL INVENTORY.pdf
          </Button>
          <Button size="sm" variant="outline-secondary" href={`${refBase}williams-collection-forms.docx`} target="_blank" rel="noreferrer">
            Williams Collection Forms (.docx)
          </Button>
        </Stack>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab((prev) => (prev === k ? null : k))}
        className="mb-3"
      >
        <Tab eventKey="williams" title="Williams Analysis">
          {williamsView}
        </Tab>
        <Tab eventKey="skeletal" title="Skeletal Inventory">
          {skeletalView}
        </Tab>
      </Tabs>

      {/* Version History */}
      {versions.length > 1 && (
        <>
          <h5 className="mt-4">Version History</h5>
          <Table size="sm" hover>
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
                        <Button size="sm" variant="outline-warning" onClick={() => handleRestoreVersion(v.versionID)}>
                          Restore
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
};

export default DonorView;

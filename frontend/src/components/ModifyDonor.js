import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Spinner, Alert, Card, Stack, Table, Collapse, Tabs, Tab } from "react-bootstrap";
import { useAPI } from "../contexts/AppContext";
import { toDBSchema } from "../services/donorDataService";
import {
  ANALYSIS_FIELDS,
  ELEMENT_GROUPS,
  elemKey,
  defaultElementInventory,
  defaultAnalysis,
} from "../services/williamsForm";
import skeletalHomunculusImg from "../assets/skeletal_inventory_homunculus.png";
import traumaHomunculusImg from "../assets/trauma_homunculus.png";

// Osteometry measurement order follows the Skeletal Analysis form's numbered list
// (items 1–81). Measurements not on the form are kept but appended at the end
// of their bone group.
const OSTEOMETRY_FIELDS = {
  cranium: [
    { key: "maximum_cranial_length",     label: "Maximum Cranial Length (GOL)",         unit: "mm" },
    { key: "maximum_cranial_breadth",    label: "Maximum Cranial Breadth (XCB)",        unit: "mm" },
    { key: "bizygomatic_breadth",        label: "Bizygomatic Diameter (ZYB)",            unit: "mm" },
    { key: "basion_bregma_height",       label: "Basion-Bregma Height (BBH)",           unit: "mm" },
    { key: "cranial_base_length",        label: "Cranial Base Length (BNL)",            unit: "mm" },
    { key: "basion_prosthion_length",    label: "Basion-Prosthion Length (BPL)",        unit: "mm" },
    { key: "maxilloalveolar_breadth",    label: "Maxillo-Alveolar Breadth (MAB)",       unit: "mm" },
    { key: "maxilloalveolar_length",     label: "Maxillo-Alveolar Length (MAL)",        unit: "mm" },
    { key: "biauricular_breadth",        label: "Biauricular Breadth (AUB)",            unit: "mm" },
    { key: "upper_facial_height",        label: "Upper Facial Height (UFHT)",           unit: "mm" },
    { key: "min_frontal_breadth",        label: "Minimum Frontal Breadth (WFB)",        unit: "mm" },
    { key: "upper_facial_breadth",       label: "Upper Facial Breadth (UFBR)",          unit: "mm" },
    { key: "nasal_height",               label: "Nasal Height (NLH)",                   unit: "mm" },
    { key: "nasal_breadth",              label: "Nasal Breadth (NLB)",                  unit: "mm" },
    { key: "orbital_breadth",            label: "Orbital Breadth (OBB)",                unit: "mm" },
    { key: "orbital_height",             label: "Orbital Height (OBH)",                 unit: "mm" },
    { key: "biorbital_breadth",          label: "Biorbital Breadth (EKB)",              unit: "mm" },
    { key: "interorbital_breadth",       label: "Interorbital Breadth (DKB)",           unit: "mm" },
    { key: "frontal_chord",              label: "Frontal Chord (FRC)",                  unit: "mm" },
    { key: "parietal_chord",             label: "Parietal Chord (PAC)",                 unit: "mm" },
    { key: "occipital_chord",            label: "Occipital Chord (OCC)",                unit: "mm" },
    { key: "foramen_magnum_length",      label: "Foramen Magnum Length (FOL)",          unit: "mm" },
    { key: "foramen_magnum_breadth",     label: "Foramen Magnum Breadth (FOB)",         unit: "mm" },
    { key: "mastoid_length",             label: "Mastoid Length (MDH)",                 unit: "mm" },
  ],
  mandible: [
    { key: "chin_height",                label: "Chin Height (GNI)",                    unit: "mm" },
    { key: "mandibular_body_height",     label: "Height of Mandibular Body (HMF)",      unit: "mm" },
    { key: "mandibular_body_breadth",    label: "Breadth of Mandibular Body (TMF)",     unit: "mm" },
    { key: "bigonial_breadth",           label: "Bigonial Width (GOG)",               unit: "mm" },
    { key: "bicondylar_breadth",         label: "Bicondylar Breadth (CDB)",             unit: "mm" },
    { key: "min_ramus_breadth",          label: "Minimum Ramus Breadth (WRB)",          unit: "mm" },
    { key: "max_ramus_breadth",          label: "Maximum Ramus Breadth (XRB)",          unit: "mm" },
    { key: "mandible_length",            label: "Mandible Length",                      unit: "mm" },
    { key: "symphysis_height",           label: "Symphysis Height",                     unit: "mm" },
    { key: "ramus_height",               label: "Ramus Height",                         unit: "mm" },
  ],
  clavicle: [
    { key: "clavicle_max_length",        label: "Maximum Length (XLN)",                 unit: "mm" },
    { key: "clavicle_ap_diameter",       label: "Ant.-Post. Diameter at Midshaft (APD)",unit: "mm" },
    { key: "clavicle_si_diameter",       label: "Sup.-Inf. Diameter at Midshaft (VRD)", unit: "mm" },
  ],
  scapula: [
    { key: "scapula_height",             label: "Anatomical Height (PHT)",              unit: "mm" },
    { key: "scapula_breadth",            label: "Anatomical Breadth (PBR)",             unit: "mm" },
    { key: "glenoid_height",             label: "Glenoid Cavity Height",                unit: "mm" },
    { key: "glenoid_breadth",            label: "Glenoid Cavity Breadth",               unit: "mm" },
  ],
  humerus: [
    { key: "humerus_max_length",         label: "Maximum Length (XLN)",                 unit: "mm" },
    { key: "humerus_epicondylar_width",  label: "Epicondylar Breadth (EBR)",            unit: "mm" },
    { key: "humerus_head_diameter",      label: "Vertical Diameter of Head (HDD)",                  unit: "mm" },
    { key: "humerus_max_diam_midshaft",  label: "Maximum Diameter at Midshaft (MXD)",   unit: "mm" },
    { key: "humerus_min_diam_midshaft",  label: "Minimum Diameter at Midshaft (MWD)",   unit: "mm" },
  ],
  radius: [
    { key: "radius_max_length",          label: "Maximum Length (XLN)",                 unit: "mm" },
    { key: "radius_sagittal_diameter",   label: "Ant.-Post. Diameter at Midshaft (APD)",unit: "mm" },
    { key: "radius_transverse_diameter", label: "Med.-Lat. Diameter at Midshaft (TVD)", unit: "mm" },
  ],
  ulna: [
    { key: "ulna_max_length",            label: "Maximum Length (XLN)",                 unit: "mm" },
    { key: "ulna_dorso_volar_diam",      label: "Dorso-Volar Diameter (DVD)",           unit: "mm" },
    { key: "ulna_transverse_diam",       label: "Transverse Diameter (TVD)",            unit: "mm" },
    { key: "ulna_physiological_length",  label: "Physiological Length",                 unit: "mm" },
  ],
  sacrum: [
    { key: "sacrum_ant_height",          label: "Anterior Height (AHT)",                unit: "mm" },
    { key: "sacrum_ant_sup_breadth",     label: "Ant.-Sup. Breadth (ABR)",              unit: "mm" },
    { key: "sacrum_s1_breadth",          label: "Max. Trans. Diameter of Base S1 (S1B)",unit: "mm" },
  ],
  os_coxa: [
    { key: "os_coxa_height",             label: "Innominate Height (OHT)",              unit: "mm" },
    { key: "iliac_breadth",              label: "Iliac Breadth (ABR)",                  unit: "mm" },
    { key: "pubis_length",               label: "Pubis Length",                         unit: "mm" },
    { key: "ischium_length",             label: "Ischium Length",                       unit: "mm" },
  ],
  femur: [
    { key: "femur_max_length",           label: "Maximum Length (XLN)",                 unit: "mm" },
    { key: "femur_bicondylar_length",    label: "Bicondylar Length (BLN)",              unit: "mm" },
    { key: "femur_epicondylar_breadth",  label: "Epicondylar Breadth (EBR)",            unit: "mm" },
    { key: "femur_head_diameter",        label: "Maximum Diameter of Femoral Head (HDD)",                  unit: "mm" },
    { key: "femur_ap_subtrochanteric",   label: "Ant.-Post. Subtrochanteric Diameter (SAP)",   unit: "mm" },
    { key: "femur_ml_subtrochanteric",   label: "Med.-Lat. Subtrochanteric Diameter (STV)",   unit: "mm" },
    { key: "femur_ap_midshaft",          label: "Ant.-Post. Midshaft Diameter (MAP)",          unit: "mm" },
    { key: "femur_ml_midshaft",          label: "Med.-Lat. Midshaft Diameter (MTV)",          unit: "mm" },
    { key: "femur_midshaft_circ",        label: "Midshaft Circumference",               unit: "mm" },
    { key: "femur_bicondylar_width",     label: "Distal Bicondylar Width",              unit: "mm" },
  ],
  tibia: [
    { key: "tibia_max_length",           label: "Maximum Condylo-Malleolar Length* (XLN)",                 unit: "mm" },
    { key: "tibia_prox_epiphyseal",      label: "Maximum Prox. Epiphyseal Breadth (PEB)",  unit: "mm" },
    { key: "tibia_dist_epiphyseal",      label: "Maximum Dist. Epiphyseal Breadth (DEB)",  unit: "mm" },
    { key: "tibia_ap_nutrient_foramen",  label: "Maximum Diameter at Nutrient Foramen (NFX)",unit: "mm" },
    { key: "tibia_ml_nutrient_foramen",  label: "Max. Med.-Lat. Diameter at Nutrient Foramen (NFT)",unit: "mm" },
    { key: "tibia_midshaft_circ",        label: "Midshaft Circumference",               unit: "mm" },
    { key: "tibia_distal_breadth",       label: "Distal Breadth",                       unit: "mm" },
  ],
  fibula: [
    { key: "fibula_max_length",          label: "Maximum Length (XLN)",                 unit: "mm" },
    { key: "fibula_max_diam_midshaft",   label: "Maximum Diameter at Midshaft (MDM)",   unit: "mm" },
  ],
  calcaneus: [
    { key: "calcaneus_max_length",       label: "Maximum Length (CXL)",                 unit: "mm" },
    { key: "calcaneus_middle_breadth",   label: "Middle Breadth (CBR)",                 unit: "mm" },
  ],
  talus: [
    { key: "talus_max_length",           label: "Maximum Length",                       unit: "mm" },
    { key: "talus_max_breadth",          label: "Maximum Breadth",                      unit: "mm" },
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

const SKULL_SINGLES   = ["frontal","occipital","ethmoid","vomer","sphenoid","mandible"];
const SKULL_BILATERAL = ["parietal","temporal","zygomatic","palatine","maxilla","nasal","lacrimal"];
// Skull bones in the SKELETAL form's column order (col 1 top→bottom, then col 2).
const SKULL_ORDER     = ["frontal","occipital","parietal","temporal","zygomatic","palatine","mandible","maxilla","nasal","ethmoid","lacrimal","vomer","sphenoid"];
const SKULL_LABELS    = { frontal:"Frontal", occipital:"Occipital", ethmoid:"Ethmoid", vomer:"Vomer", sphenoid:"Sphenoid", mandible:"Mandible", parietal:"Parietal", temporal:"Temporal", zygomatic:"Zygomatic", palatine:"Palatine", maxilla:"Maxilla", nasal:"Nasal", lacrimal:"Lacrimal" };
// Sacrum and Coccyx live in the Vertebrae section (per the SKELETAL INVENTORY
// PDF), not with the small axial elements.
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
const COMP_CODES      = ["1","2","3","4","5"];
const WEAR_CODES      = ["1","2","3","4","5"];

const defaultSkeleton = () => {
  const s = { comments: "" };
  SKULL_SINGLES.forEach(k => { s[k] = ""; });
  SKULL_BILATERAL.forEach(k => { s[`${k}_l`] = ""; s[`${k}_r`] = ""; });
  AXIAL_SINGLES.forEach(k => { s[k] = ""; });
  s.sacrum = "";
  s.coccyx = "";
  s.coccyx_count = "";
  GIRDLE_BILATERAL.forEach(k => { s[`${k}_l`] = ""; s[`${k}_r`] = ""; });
  LONG_BONES.forEach(b => {
    ["l","r"].forEach(side => {
      s[`${b}_${side}`] = "";
      s[`${b}_${side}_prox`] = "";
      s[`${b}_${side}_dist`] = "";
    });
  });
  [...CARPAL_BONES, ...TARSAL_BONES].forEach(b => { s[`${b}_l`] = ""; s[`${b}_r`] = ""; });
  for (let i = 1; i <= 5; i++) {
    s[`mc${i}_l`] = ""; s[`mc${i}_r`] = "";
    s[`mt${i}_l`] = ""; s[`mt${i}_r`] = "";
  }
  ["hand_prox","hand_middle","hand_distal","foot_prox","foot_middle","foot_distal"].forEach(k => {
    s[`${k}_l`] = ""; s[`${k}_r`] = "";
  });
  s.cervical_count = "";
  for (let i = 1; i <= 7; i++) s[`c${i}`] = "";
  s.thoracic_count = "";
  for (let i = 1; i <= 12; i++) s[`t${i}`] = "";
  s.lumbar_count = "";
  for (let i = 1; i <= 5; i++) s[`l${i}`] = "";
  s.ribs_count = "";
  for (let i = 1; i <= 12; i++) { s[`rib${i}_l`] = ""; s[`rib${i}_r`] = ""; }
  return s;
};

const defaultDonorData = () => ({
  identification: {
    ancestry: "",
    sex: "male",
    age: "",
    recorder: "",
    date: "",
    autopsy: false,
    condition: "good",
  },
  skeleton: defaultSkeleton(),
  dentition: { teeth: Array(32).fill("N"), wearScores: Array(32).fill("") },
  osteometry: Object.fromEntries(
    Object.values(OSTEOMETRY_FIELDS).flat().map((f) => [f.key, ""])
  ),
  notes: {
    general_observations: "",
    trauma_and_pathological_analysis: "",
    general_observations_2: "",
    trauma_instruments: "",
    trauma_exemplars: "",
    general_observations_2_instruments: "",
    general_observations_2_exemplars: "",
    continuation: "",
    continuation_instruments: "",
    continuation_exemplars: "",
  },
  analysis: defaultAnalysis(),
  element_inventory: defaultElementInventory(),
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
  const [open, setOpen] = useState({ donorID: true, identification: true, analysis: false, element_inventory: false, skeleton: false, dentition: false, osteometry: false, notes: false });
  const toggle = (s) => setOpen(prev => ({ ...prev, [s]: !prev[s] }));
  // Both tabs start closed; clicking a tab opens it, clicking the open tab closes it.
  const [activeTab, setActiveTab] = useState(null);
  // Each Element Inventory subsection (Cranium, Axial, …) is individually collapsible.
  const [elemOpen, setElemOpen] = useState({});
  const toggleElem = (key) => setElemOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  // Each Osteometry subsection (Cranium, Mandible, …) is individually collapsible.
  const [osteoOpen, setOsteoOpen] = useState({});
  const toggleOsteo = (key) => setOsteoOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  // Each Skeletal Inventory subsection (Cranial, Axial, …) is individually collapsible.
  const [skelOpen, setSkelOpen] = useState({});
  const toggleSkel = (key) => setSkelOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (create) {
      api.donor.getNextID().then((res) => setDonorID(res.data.nextID)).catch(console.error);
      return;
    }
    const load = async () => {
      try {
        const res = await api.donor.getByDid(did);
        const d = res.data.donor;
        setDonorID(d.donorID);
        const saved = d.data ?? defaultDonorData();
        saved.identification = { ...defaultDonorData().identification, ...(saved.identification ?? {}) };
        saved.osteometry = { ...defaultDonorData().osteometry, ...(saved.osteometry ?? {}) };
        saved.skeleton = { ...defaultSkeleton(), ...(saved.skeleton ?? {}) };
        if (!saved.dentition?.teeth) saved.dentition = { teeth: Array(32).fill("N"), wearScores: Array(32).fill("") };
        if (!saved.dentition.wearScores) saved.dentition.wearScores = Array(32).fill("");
        saved.notes = { ...defaultDonorData().notes, ...(saved.notes ?? {}) };
        saved.analysis = { ...defaultAnalysis(), ...(saved.analysis ?? {}) };
        saved.element_inventory = { ...defaultElementInventory(), ...(saved.element_inventory ?? {}) };
        setDonorData(saved);
      } catch (err) {
        setError("Failed to load donor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api, create, did]);

  const handleIdentChange = (field, value) =>
    setDonorData((prev) => ({ ...prev, identification: { ...prev.identification, [field]: value } }));

  const handleNotesChange = (field, value) =>
    setDonorData((prev) => ({ ...prev, notes: { ...prev.notes, [field]: value } }));

  const handleAnalysisChange = (field, value) =>
    setDonorData((prev) => ({ ...prev, analysis: { ...prev.analysis, [field]: value } }));

  const handleInventoryChange = (key, patch) =>
    setDonorData((prev) => ({
      ...prev,
      element_inventory: {
        ...prev.element_inventory,
        [key]: { ...prev.element_inventory[key], ...patch },
      },
    }));

  const handleOsteometryChange = (key, value) =>
    setDonorData((prev) => ({ ...prev, osteometry: { ...prev.osteometry, [key]: value } }));

  const handleSkeletonChange = (key, value) =>
    setDonorData((prev) => ({ ...prev, skeleton: { ...prev.skeleton, [key]: value } }));

  const handleDentitionChange = (index, value) =>
    setDonorData((prev) => {
      const teeth = [...prev.dentition.teeth];
      teeth[index] = value;
      return { ...prev, dentition: { ...prev.dentition, teeth } };
    });

  const handleWearScoreChange = (index, value) =>
    setDonorData((prev) => {
      const wearScores = [...prev.dentition.wearScores];
      wearScores[index] = value;
      return { ...prev, dentition: { ...prev.dentition, wearScores } };
    });

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
  const osteometry = donorData.osteometry;
  const skeleton = donorData.skeleton;
  const analysis = donorData.analysis ?? defaultAnalysis();
  const inventory = donorData.element_inventory ?? defaultElementInventory();
  const teeth = donorData.dentition?.teeth ?? Array(32).fill("N");
  const wearScores = donorData.dentition?.wearScores ?? Array(32).fill("");

  const CodeSelect = ({ field, placeholder = "—" }) => (
    <Form.Select size="sm" value={skeleton[field] ?? ""} onChange={e => handleSkeletonChange(field, e.target.value)}>
      <option value="">{placeholder}</option>
      {COMP_CODES.map(v => <option key={v} value={v}>{v}</option>)}
    </Form.Select>
  );

  // Collapsible subsection heading for the Skeletal Inventory section.
  const skelHead = (sk, title) => (
    <h6
      onClick={() => toggleSkel(sk)}
      style={{ cursor: "pointer", userSelect: "none" }}
      className="text-uppercase text-muted border-bottom pb-1 mb-2 d-flex justify-content-between align-items-center"
    >
      <span>{title}</span>
      <span>{skelOpen[sk] ? "▲" : "▼"}</span>
    </h6>
  );

  // Instruments/Equipment Used + Exemplars Used pair that the Skeletal Analysis form
  // repeats under the Trauma, General Observations and Continuation boxes.
  // Returned as inline JSX (not a component) so inputs keep focus while typing.
  const instrExemplars = (base) => (
    <div className="row g-3 mt-1">
      <div className="col-md-6">
        <Form.Group>
          <Form.Label className="small mb-1">Instruments/Equipment Used (Type and ID#)</Form.Label>
          <Form.Control as="textarea" rows={2} value={notes[`${base}_instruments`] ?? ""} onChange={(e) => handleNotesChange(`${base}_instruments`, e.target.value)} />
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group>
          <Form.Label className="small mb-1">Exemplars Used</Form.Label>
          <Form.Control as="textarea" rows={2} value={notes[`${base}_exemplars`] ?? ""} onChange={(e) => handleNotesChange(`${base}_exemplars`, e.target.value)} />
        </Form.Group>
      </div>
    </div>
  );

  // ---- Skeletal Analysis form ------------------------------------------------
  const williamsTab = (
    <>
      {/* Analysis Header (Skeletal Analysis form) — front of the Skeletal Analysis packet */}
      <Card className="mb-3">
        <Card.Header onClick={() => toggle("analysis")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
          <span><strong>Analysis</strong><span className="text-muted fw-normal ms-2 small">Skeletal Analysis Collection lab form header</span></span>
          <span className="text-muted">{open.analysis ? "▲" : "▼"}</span>
        </Card.Header>
        <Collapse in={open.analysis}><div>
        <Card.Body>
          <div className="row g-3">
            {ANALYSIS_FIELDS.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "col-12" : "col-md-4"}>
                <Form.Group>
                  <Form.Label className="small mb-1">{f.label}</Form.Label>
                  {f.type === "textarea" ? (
                    <Form.Control as="textarea" rows={2} value={analysis[f.key] ?? ""} onChange={(e) => handleAnalysisChange(f.key, e.target.value)} />
                  ) : (
                    <Form.Control size="sm" type={f.type === "date" ? "date" : "text"} value={analysis[f.key] ?? ""} onChange={(e) => handleAnalysisChange(f.key, e.target.value)} />
                  )}
                </Form.Group>
              </div>
            ))}
          </div>
        </Card.Body>
        </div></Collapse>
      </Card>

      {/* Element Inventory (Present/Absent/Observations) + Skeletal Inventory Homunculus */}
      <Card className="mb-3">
        <Card.Header onClick={() => toggle("element_inventory")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
          <span><strong>Element Inventory</strong><span className="text-muted fw-normal ms-2 small">Present / Absent &amp; observations per element</span></span>
          <span className="text-muted">{open.element_inventory ? "▲" : "▼"}</span>
        </Card.Header>
        <Collapse in={open.element_inventory}><div>
        <Card.Body>
          {ELEMENT_GROUPS.map((group) => (
            <div key={group.key} className="mb-3">
              <h6
                onClick={() => toggleElem(group.key)}
                style={{ cursor: "pointer", userSelect: "none" }}
                className="text-uppercase text-muted border-bottom pb-1 mb-2 d-flex justify-content-between align-items-center"
              >
                <span>{group.label}</span>
                <span>{elemOpen[group.key] ? "▲" : "▼"}</span>
              </h6>
              <Collapse in={!!elemOpen[group.key]}><div>
              <Table size="sm" bordered className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Element</th>
                    <th className="text-center" style={{ width: 80 }}>Absent</th>
                    <th>Other Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {group.elements.map((el) => {
                    const k = elemKey(group.key, el.key);
                    const cell = inventory[k] ?? { absent: false, obs: "" };
                    return (
                      <tr key={k}>
                        <td className="small fw-semibold">{el.label}</td>
                        <td className="text-center">
                          <Form.Check type="checkbox" checked={!!cell.absent} onChange={(e) => handleInventoryChange(k, { absent: e.target.checked })} />
                        </td>
                        <td>
                          <Form.Control size="sm" value={cell.obs ?? ""} onChange={(e) => handleInventoryChange(k, { obs: e.target.value })} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              </div></Collapse>
            </div>
          ))}
          {/* Skeletal Inventory Homunculus sits at the bottom of the section (per the form) */}
          <div className="text-center mt-3">
            <img src={skeletalHomunculusImg} alt="Skeletal Inventory Homunculus" style={{ width: "100%", maxWidth: 700, height: "auto" }} />
          </div>
        </Card.Body>
        </div></Collapse>
      </Card>

      {/* General Observations (first box — summary of absent elements & trauma/pathology) */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-semibold">General Observations</Form.Label>
            <div className="text-muted small mb-1">Please provide a summary of elements that are absent and any trauma or pathological indicators you observed.</div>
            <Form.Control as="textarea" rows={5} value={notes.general_observations} onChange={(e) => handleNotesChange("general_observations", e.target.value)} />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Osteometry */}
      <Card className="mb-3">
        <Card.Header onClick={() => toggle("osteometry")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
          <span><strong>Osteometry</strong> <span className="text-muted fw-normal">(all measurements in mm)</span></span>
          <span className="text-muted">{open.osteometry ? "▲" : "▼"}</span>
        </Card.Header>
        <Collapse in={open.osteometry}><div>
        <Card.Body>
          {Object.entries(OSTEOMETRY_FIELDS).map(([group, fields]) => (
            <div key={group} className="mb-3">
              <h6
                onClick={() => toggleOsteo(group)}
                style={{ cursor: "pointer", userSelect: "none" }}
                className="text-uppercase text-muted border-bottom pb-1 mb-2 d-flex justify-content-between align-items-center"
              >
                <span>{BONE_GROUP_LABELS[group]}</span>
                <span>{osteoOpen[group] ? "▲" : "▼"}</span>
              </h6>
              <Collapse in={!!osteoOpen[group]}><div>
              <div className="row g-2">
                {fields.map(({ key, label, unit }) => (
                  <div key={key} className="col-md-4">
                    <Form.Group>
                      <Form.Label className="small mb-1">{label}</Form.Label>
                      <div className="input-group input-group-sm">
                        <Form.Control
                          type="number"
                          min={0}
                          step="0.1"
                          placeholder="—"
                          value={osteometry[key] ?? ""}
                          onChange={(e) => handleOsteometryChange(key, e.target.value)}
                        />
                        <span className="input-group-text">{unit}</span>
                      </div>
                    </Form.Group>
                  </div>
                ))}
              </div>
              </div></Collapse>
            </div>
          ))}
        </Card.Body>
        </div></Collapse>
      </Card>

      {/* Trauma and Pathological Analysis */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-semibold">Trauma and Pathological Analysis</Form.Label>
            <div className="text-muted small mb-1">Provide references where necessary/appropriate.</div>
            <Form.Control as="textarea" rows={5} value={notes.trauma_and_pathological_analysis} onChange={(e) => handleNotesChange("trauma_and_pathological_analysis", e.target.value)} />
          </Form.Group>
          {instrExemplars("trauma")}
        </Card.Body>
      </Card>

      {/* General Observations (second box) */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-semibold">General Observations</Form.Label>
            <div className="text-muted small mb-1">Provide references where necessary/appropriate.</div>
            <Form.Control as="textarea" rows={5} value={notes.general_observations_2} onChange={(e) => handleNotesChange("general_observations_2", e.target.value)} />
          </Form.Group>
          {instrExemplars("general_observations_2")}
        </Card.Body>
      </Card>

      {/* Trauma and General Observations Homunculus */}
      <Card className="mb-3">
        <Card.Body className="text-center">
          <img src={traumaHomunculusImg} alt="Trauma and General Observations Homunculus" style={{ width: "100%", maxWidth: 700, height: "auto" }} />
        </Card.Body>
      </Card>

      {/* Continuation to Skeletal Analysis */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-semibold">Continuation to Skeletal Analysis</Form.Label>
            <Form.Control as="textarea" rows={5} value={notes.continuation ?? ""} onChange={(e) => handleNotesChange("continuation", e.target.value)} />
          </Form.Group>
          {instrExemplars("continuation")}
        </Card.Body>
      </Card>
    </>
  );

  // ---- SKELETAL INVENTORY form (WCU) ---------------------------------------
  const skeletalTab = (
    <>
      {/* Identification header (start of the SKELETAL INVENTORY form) */}
      <Card className="mb-3">
        <Card.Header onClick={() => toggle("identification")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
          <span><strong>Identification</strong><span className="text-muted fw-normal ms-2 small">SKELETAL INVENTORY header</span></span>
          <span className="text-muted">{open.identification ? "▲" : "▼"}</span>
        </Card.Header>
        <Collapse in={open.identification}><div>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Ancestry</Form.Label>
                <Form.Select value={id.ancestry} onChange={(e) => handleIdentChange("ancestry", e.target.value)}>
                  {["white","african","asian","hispanic","native american"].map(a => (
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
                <Form.Control type="number" min={0} max={150} value={id.age} onChange={(e) => handleIdentChange("age", e.target.value)} />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Recorder</Form.Label>
                <Form.Control value={id.recorder ?? ""} onChange={(e) => handleIdentChange("recorder", e.target.value)} />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control type="date" value={id.date ?? ""} onChange={(e) => handleIdentChange("date", e.target.value)} />
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
                <Form.Check type="checkbox" label="Autopsy performed" checked={!!id.autopsy} onChange={(e) => handleIdentChange("autopsy", e.target.checked)} />
              </Form.Group>
            </div>
          </div>
        </Card.Body>
        </div></Collapse>
      </Card>

      {/* Dentition */}
      <Card className="mb-3">
        <Card.Header onClick={() => toggle("dentition")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
          <span><strong>Dentition</strong><span className="text-muted fw-normal ms-2 small">A=antemortem absence, P=postmortem absence, N=natural, D=dental work; Wear Score 1–5</span></span>
          <span className="text-muted">{open.dentition ? "▲" : "▼"}</span>
        </Card.Header>
        <Collapse in={open.dentition}><div>
        <Card.Body>
          <div className="small text-muted mb-1">Upper (teeth 1–16, right → left)</div>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="text-center" style={{ minWidth: 48 }}>
                <div className="small text-muted">{i + 1}</div>
                <Form.Select size="sm" value={teeth[i]} onChange={e => handleDentitionChange(i, e.target.value)}>
                  {["N","A","P","D"].map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
                <Form.Select size="sm" className="mt-1" value={wearScores[i] ?? ""} onChange={e => handleWearScoreChange(i, e.target.value)} title="Wear Score">
                  <option value="">—</option>
                  {WEAR_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </div>
            ))}
          </div>
          {/* Lower jaw runs 32 → 17 left-to-right, matching the SKELETAL form. */}
          <div className="small text-muted mb-1">Lower (teeth 32–17, left → right)</div>
          <div className="d-flex flex-wrap gap-1">
            {Array.from({ length: 16 }, (_, j) => {
              const idx = 31 - j; // teeth index; tooth number = idx + 1 (32 → 17)
              return (
                <div key={idx} className="text-center" style={{ minWidth: 48 }}>
                  <div className="small text-muted">{idx + 1}</div>
                  <Form.Select size="sm" value={teeth[idx]} onChange={e => handleDentitionChange(idx, e.target.value)}>
                    {["N","A","P","D"].map(c => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                  <Form.Select size="sm" className="mt-1" value={wearScores[idx] ?? ""} onChange={e => handleWearScoreChange(idx, e.target.value)} title="Wear Score">
                    <option value="">—</option>
                    {WEAR_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </div>
              );
            })}
          </div>
        </Card.Body>
        </div></Collapse>
      </Card>

      {/* Skeletal Inventory */}
      <Card className="mb-3">
        <Card.Header onClick={() => toggle("skeleton")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
          <span><strong>Skeletal Inventory</strong><span className="text-muted fw-normal ms-2 small">Codes: 1=100%, 2=99–75%, 3=74–25%, 4=&lt;25%, 5=absent</span></span>
          <span className="text-muted">{open.skeleton ? "▲" : "▼"}</span>
        </Card.Header>
        <Collapse in={open.skeleton}><div>
        <Card.Body>
          {/* Cranial — CSS columns so bones read top-to-bottom per the SKELETAL form */}
          {skelHead("cranial", "Cranial")}
          <Collapse in={!!skelOpen.cranial}><div>
          <div className="mb-3" style={{ columnCount: 2, columnGap: "0.75rem" }}>
            {SKULL_ORDER.map(k => (
              <div key={k} className="mb-2" style={{ breakInside: "avoid" }}>
                <Form.Label className="small mb-0">{SKULL_LABELS[k]}</Form.Label>
                {SKULL_BILATERAL.includes(k) ? (
                  <div className="d-flex gap-1">
                    <div className="flex-fill">
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>L</div>
                      <CodeSelect field={`${k}_l`} placeholder="L" />
                    </div>
                    <div className="flex-fill">
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>R</div>
                      <CodeSelect field={`${k}_r`} placeholder="R" />
                    </div>
                  </div>
                ) : (
                  <CodeSelect field={k} />
                )}
              </div>
            ))}
          </div>
          </div></Collapse>

          {/* Axial */}
          {skelHead("axial", "Axial")}
          <Collapse in={!!skelOpen.axial}><div>
          <div className="row g-2 mb-3">
            {AXIAL_SINGLES.map(k => (
              <div key={k} className="col-md-2 col-sm-4">
                <Form.Label className="small mb-1">{AXIAL_LABELS[k]}</Form.Label>
                <CodeSelect field={k} />
              </div>
            ))}
          </div>
          </div></Collapse>

          {/* Shoulder / Pelvis */}
          {skelHead("girdle", "Shoulder Girdle / Pelvis")}
          <Collapse in={!!skelOpen.girdle}><div>
          <div className="row g-2 mb-3">
            {GIRDLE_BILATERAL.map(k => (
              <div key={k} className="col-md-2 col-sm-4">
                <Form.Label className="small mb-1">{GIRDLE_LABELS[k]}</Form.Label>
                <div className="d-flex gap-1">
                  <div className="flex-fill">
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>L</div>
                    <CodeSelect field={`${k}_l`} placeholder="L" />
                  </div>
                  <div className="flex-fill">
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>R</div>
                    <CodeSelect field={`${k}_r`} placeholder="R" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div></Collapse>

          {/* Long Bones */}
          {skelHead("long", "Long Bones")}
          <Collapse in={!!skelOpen.long}><div>
          <Table size="sm" bordered className="mb-3">
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
                  {["l","r"].map(side => (
                    ["", "_prox", "_dist"].map(suffix => (
                      <td key={`${side}${suffix}`}>
                        <Form.Select size="sm" value={skeleton[`${b}_${side}${suffix}`] ?? ""} onChange={e => handleSkeletonChange(`${b}_${side}${suffix}`, e.target.value)}>
                          <option value="">—</option>
                          {COMP_CODES.map(v => <option key={v} value={v}>{v}</option>)}
                        </Form.Select>
                      </td>
                    ))
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          </div></Collapse>

          {/* Carpal / Tarsal */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              {skelHead("carpal", "Carpal (Wrist) Bones")}
              <Collapse in={!!skelOpen.carpal}><div>
              {/* CSS columns so bones read top-to-bottom (Scaphoid→Pisiform | Hamate→Trapezium) per the form */}
              <div style={{ columnCount: 2, columnGap: "0.75rem" }}>
                {CARPAL_BONES.map(k => (
                  <div key={k} className="mb-2" style={{ breakInside: "avoid" }}>
                    <Form.Label className="small mb-0">{CARPAL_LABELS[k]}</Form.Label>
                    <div className="d-flex gap-1">
                      <div className="flex-fill">
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>L</div>
                        <CodeSelect field={`${k}_l`} placeholder="L" />
                      </div>
                      <div className="flex-fill">
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>R</div>
                        <CodeSelect field={`${k}_r`} placeholder="R" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div></Collapse>
            </div>
            <div className="col-md-6">
              {skelHead("tarsal", "Tarsal (Foot) Bones")}
              <Collapse in={!!skelOpen.tarsal}><div>
              {/* CSS columns so bones read top-to-bottom (Calcaneus→Cuboid | Cuneiform I→Patella) per the form */}
              <div style={{ columnCount: 2, columnGap: "0.75rem" }}>
                {TARSAL_BONES.map(k => (
                  <div key={k} className="mb-2" style={{ breakInside: "avoid" }}>
                    <Form.Label className="small mb-0">{TARSAL_LABELS[k]}</Form.Label>
                    <div className="d-flex gap-1">
                      <div className="flex-fill">
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>L</div>
                        <CodeSelect field={`${k}_l`} placeholder="L" />
                      </div>
                      <div className="flex-fill">
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>R</div>
                        <CodeSelect field={`${k}_r`} placeholder="R" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div></Collapse>
            </div>
          </div>

          {/* Metacarpals / Metatarsals */}
          <div className="row g-3 mb-3">
            {[["Metacarpals","mc"],["Metatarsals","mt"]].map(([label, prefix]) => (
              <div key={prefix} className="col-md-6">
                {skelHead(prefix, label)}
                <Collapse in={!!skelOpen[prefix]}><div>
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th></th>
                      <th className="text-center small">Left</th>
                      <th className="text-center small">Right</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5].map(i => (
                      <tr key={i}>
                        <td className="small fw-semibold">{prefix.toUpperCase()}{i}</td>
                        <td>
                          <Form.Select size="sm" value={skeleton[`${prefix}${i}_l`] ?? ""} onChange={e => handleSkeletonChange(`${prefix}${i}_l`, e.target.value)}>
                            <option value="">—</option>
                            {COMP_CODES.map(v => <option key={v} value={v}>{v}</option>)}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Select size="sm" value={skeleton[`${prefix}${i}_r`] ?? ""} onChange={e => handleSkeletonChange(`${prefix}${i}_r`, e.target.value)}>
                            <option value="">—</option>
                            {COMP_CODES.map(v => <option key={v} value={v}>{v}</option>)}
                          </Form.Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                </div></Collapse>
              </div>
            ))}
          </div>

          {/* Phalanges */}
          {skelHead("phalanges", "Phalanges (counts)")}
          <Collapse in={!!skelOpen.phalanges}><div>
          <Table size="sm" bordered className="mb-3">
            <thead>
              <tr>
                <th>Hand</th>
                <th className="text-center small">L #</th>
                <th className="text-center small">R #</th>
                <th>Foot</th>
                <th className="text-center small">L #</th>
                <th className="text-center small">R #</th>
              </tr>
            </thead>
            <tbody>
              {[["Proximal","hand_prox","foot_prox"],["Middle","hand_middle","foot_middle"],["Distal","hand_distal","foot_distal"]].map(([lbl, hk, fk]) => (
                <tr key={hk}>
                  <td className="small fw-semibold">{lbl}</td>
                  <td><Form.Control size="sm" type="number" min={0} value={skeleton[`${hk}_l`] ?? ""} onChange={e => handleSkeletonChange(`${hk}_l`, e.target.value)} /></td>
                  <td><Form.Control size="sm" type="number" min={0} value={skeleton[`${hk}_r`] ?? ""} onChange={e => handleSkeletonChange(`${hk}_r`, e.target.value)} /></td>
                  <td className="small fw-semibold">{lbl}</td>
                  <td><Form.Control size="sm" type="number" min={0} value={skeleton[`${fk}_l`] ?? ""} onChange={e => handleSkeletonChange(`${fk}_l`, e.target.value)} /></td>
                  <td><Form.Control size="sm" type="number" min={0} value={skeleton[`${fk}_r`] ?? ""} onChange={e => handleSkeletonChange(`${fk}_r`, e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div></Collapse>

          {/* Vertebrae */}
          {skelHead("vertebrae", "Vertebrae")}
          <Collapse in={!!skelOpen.vertebrae}><div>
          {[
            { label: "Cervical", prefix: "c", count: "cervical_count", total: 7 },
            { label: "Thoracic", prefix: "t", count: "thoracic_count", total: 12 },
            { label: "Lumbar",   prefix: "l", count: "lumbar_count",   total: 5 },
          ].map(({ label, prefix, count, total }) => (
            <div key={prefix} className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="small fw-semibold" style={{ minWidth: 65 }}>{label}</span>
                <Form.Control size="sm" type="number" min={0} max={total} placeholder="Count" style={{ width: 80 }} value={skeleton[count] ?? ""} onChange={e => handleSkeletonChange(count, e.target.value)} />
              </div>
              <div className="d-flex flex-wrap gap-1">
                {Array.from({ length: total }, (_, i) => i + 1).map(i => (
                  <div key={i} style={{ width: 68 }}>
                    <div className="small text-center text-muted">{prefix.toUpperCase()}{i}</div>
                    <Form.Select size="sm" value={skeleton[`${prefix}${i}`] ?? ""} onChange={e => handleSkeletonChange(`${prefix}${i}`, e.target.value)}>
                      <option value="">—</option>
                      {COMP_CODES.map(v => <option key={v} value={v}>{v}</option>)}
                    </Form.Select>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Sacrum & Coccyx (part of the vertebral column on the SKELETAL form) */}
          <div className="row g-2 mb-3">
            <div className="col-md-2 col-sm-4">
              <Form.Label className="small mb-1">{AXIAL_LABELS.sacrum}</Form.Label>
              <CodeSelect field="sacrum" />
            </div>
            <div className="col-md-2 col-sm-4">
              <Form.Label className="small mb-1">{AXIAL_LABELS.coccyx}</Form.Label>
              <CodeSelect field="coccyx" />
            </div>
            <div className="col-md-2 col-sm-4">
              <Form.Label className="small mb-1">Coccyx # pieces</Form.Label>
              <Form.Control size="sm" type="number" min={0} value={skeleton.coccyx_count ?? ""} onChange={e => handleSkeletonChange("coccyx_count", e.target.value)} />
            </div>
          </div>
          </div></Collapse>

          {/* Ribs */}
          {skelHead("ribs", "Ribs")}
          <Collapse in={!!skelOpen.ribs}><div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="small fw-semibold">Total count:</span>
            <Form.Control size="sm" type="number" min={0} max={24} style={{ width: 80 }} placeholder="#" value={skeleton.ribs_count ?? ""} onChange={e => handleSkeletonChange("ribs_count", e.target.value)} />
          </div>
          <Table size="sm" bordered className="mb-3">
            <thead>
              <tr>
                <th>Rib</th>
                <th className="text-center small">Left</th>
                <th className="text-center small">Right</th>
                <th>Rib</th>
                <th className="text-center small">Left</th>
                <th className="text-center small">Right</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6].map(i => (
                <tr key={i}>
                  <td className="small fw-semibold">R{i}</td>
                  <td><Form.Select size="sm" value={skeleton[`rib${i}_l`] ?? ""} onChange={e => handleSkeletonChange(`rib${i}_l`, e.target.value)}><option value="">—</option>{COMP_CODES.map(v=><option key={v} value={v}>{v}</option>)}</Form.Select></td>
                  <td><Form.Select size="sm" value={skeleton[`rib${i}_r`] ?? ""} onChange={e => handleSkeletonChange(`rib${i}_r`, e.target.value)}><option value="">—</option>{COMP_CODES.map(v=><option key={v} value={v}>{v}</option>)}</Form.Select></td>
                  <td className="small fw-semibold">R{i+6}</td>
                  <td><Form.Select size="sm" value={skeleton[`rib${i+6}_l`] ?? ""} onChange={e => handleSkeletonChange(`rib${i+6}_l`, e.target.value)}><option value="">—</option>{COMP_CODES.map(v=><option key={v} value={v}>{v}</option>)}</Form.Select></td>
                  <td><Form.Select size="sm" value={skeleton[`rib${i+6}_r`] ?? ""} onChange={e => handleSkeletonChange(`rib${i+6}_r`, e.target.value)}><option value="">—</option>{COMP_CODES.map(v=><option key={v} value={v}>{v}</option>)}</Form.Select></td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div></Collapse>

          {/* Comments */}
          {skelHead("comments", "Comments / Notes")}
          <Collapse in={!!skelOpen.comments}><div>
          <Form.Group>
            <Form.Control as="textarea" rows={3} value={skeleton.comments ?? ""} onChange={e => handleSkeletonChange("comments", e.target.value)} />
          </Form.Group>
          </div></Collapse>
        </Card.Body>
        </div></Collapse>
      </Card>
    </>
  );

  return (
    <div>
      <Stack direction="horizontal" className="mb-3">
        <h2 className="me-auto">{create ? "New Donor" : `Edit Donor ${donorID}`}</h2>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>Cancel</Button>
      </Stack>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>

        {/* Donor ID (shared across both forms) */}
        <Card className="mb-3">
          <Card.Header onClick={() => toggle("donorID")} style={{ cursor: "pointer", userSelect: "none" }} className="d-flex justify-content-between align-items-center">
            <strong>Donor ID</strong><span className="text-muted">{open.donorID ? "▲" : "▼"}</span>
          </Card.Header>
          <Collapse in={open.donorID}><div>
          <Card.Body>
            <Form.Group>
              <Form.Label>ID</Form.Label>
              <Form.Control value={donorID} onChange={(e) => setDonorID(e.target.value)} readOnly={!create} required />
            </Form.Group>
          </Card.Body>
          </div></Collapse>
        </Card>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab((prev) => (prev === k ? null : k))}
          className="mb-3"
        >
          <Tab eventKey="skeletal" title="Skeletal Inventory">
            {skeletalTab}
          </Tab>
          <Tab eventKey="williams" title="Skeletal Analysis">
            {williamsTab}
          </Tab>
        </Tabs>

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

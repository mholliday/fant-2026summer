// williamsForm.js
// Shared definitions for the "John A. Williams Human Skeletal Collection"
// lab inventory & analysis form. Used by both the donor edit form
// (ModifyDonor) and the donor view (DonorView). The backend PDF template
// (backend/utilities/williamsTemplate.js) keeps a parallel copy of the
// element list because it runs under CommonJS.

// --- Analysis header (top of the Williams packet) -------------------------
export const ANALYSIS_FIELDS = [
  { key: "cil",          label: "CIL",                                     type: "text" },
  { key: "analyst",      label: "Analyst",                                 type: "text" },
  { key: "signature",    label: "Signature / Initials",                    type: "text" },
  { key: "date_started", label: "Date Analysis Started",                   type: "date" },
  { key: "date_ended",   label: "Date Analysis Ended",                     type: "date" },
  { key: "instruments",  label: "Instruments / Equipment Used (Type & ID#)", type: "textarea" },
  { key: "exemplars",    label: "Exemplars Used",                          type: "textarea" },
];

// --- Element Present / Absent / Observations inventory --------------------
// Each group has a list of elements. The stored key for an element is
// `${group.key}__${element.key}` so identical element names on the left and
// right sides stay distinct.
const ARM_ELEMENTS = [
  { key: "clavicle",        label: "Clavicle" },
  { key: "scapula",         label: "Scapula" },
  { key: "humerus",         label: "Humerus" },
  { key: "radius",          label: "Radius" },
  { key: "ulna",            label: "Ulna" },
  { key: "scaphoid",        label: "Scaphoid" },
  { key: "lunate",          label: "Lunate" },
  { key: "triquetral",      label: "Triquetral" },
  { key: "pisiform",        label: "Pisiform" },
  { key: "hamate",          label: "Hamate" },
  { key: "capitate",        label: "Capitate" },
  { key: "trapezoid",       label: "Trapezoid" },
  { key: "trapezium",       label: "Trapezium" },
  { key: "metacarpals",     label: "Metacarpals" },
  { key: "phalanges_prox",  label: "Phalanges — Proximal" },
  { key: "phalanges_inter", label: "Phalanges — Intermediate" },
  { key: "phalanges_dist",  label: "Phalanges — Distal" },
];

const LEG_ELEMENTS = [
  { key: "innominate",      label: "Innominate" },
  { key: "femur",           label: "Femur" },
  { key: "patella",         label: "Patella" },
  { key: "tibia",           label: "Tibia" },
  { key: "fibula",          label: "Fibula" },
  { key: "calcaneus",       label: "Calcaneus" },
  { key: "talus",           label: "Talus" },
  { key: "navicular",       label: "Navicular" },
  { key: "cuboid",          label: "Cuboid" },
  { key: "med_cuneiform",   label: "Medial Cuneiform" },
  { key: "int_cuneiform",   label: "Intermediate Cuneiform" },
  { key: "lat_cuneiform",   label: "Lateral Cuneiform" },
  { key: "metatarsals",     label: "Metatarsals" },
  { key: "phalanges_prox",  label: "Phalanges — Proximal" },
  { key: "phalanges_inter", label: "Phalanges — Intermediate" },
  { key: "phalanges_dist",  label: "Phalanges — Distal" },
];

export const ELEMENT_GROUPS = [
  {
    key: "cranium", label: "Cranium",
    elements: [
      { key: "vault",       label: "Vault" },
      { key: "basicranium", label: "Basicranium" },
      { key: "facial",      label: "Facial" },
      { key: "mandible",    label: "Mandible" },
      { key: "teeth",       label: "Teeth" },
    ],
  },
  {
    key: "axial", label: "Axial Skeleton",
    elements: [
      { key: "c1",           label: "C1" },
      { key: "c2",           label: "C2" },
      { key: "c3_7",         label: "C3–7" },
      { key: "t1",           label: "T1" },
      { key: "t2_9",         label: "T2–9" },
      { key: "t10_12",       label: "T10–12" },
      { key: "l1_4",         label: "L1–4" },
      { key: "l5",           label: "L5" },
      { key: "sacrum",       label: "Sacrum" },
      { key: "ribs_l",       label: "L Ribs" },
      { key: "ribs_r",       label: "R Ribs" },
      { key: "ribs_unsided", label: "Unsided Ribs" },
    ],
  },
  { key: "left_arm",  label: "Left Arm",  elements: ARM_ELEMENTS },
  { key: "right_arm", label: "Right Arm", elements: ARM_ELEMENTS },
  { key: "left_leg",  label: "Left Leg",  elements: LEG_ELEMENTS },
  { key: "right_leg", label: "Right Leg", elements: LEG_ELEMENTS },
  {
    key: "other", label: "Other",
    elements: [
      { key: "hyoid",     label: "Hyoid" },
      { key: "sternum",   label: "Sternum" },
      { key: "sesamoids", label: "Sesamoids" },
    ],
  },
];

export const elemKey = (groupKey, elementKey) => `${groupKey}__${elementKey}`;

// Default inventory: every element starts present (absent === false) with
// no observations, matching a fresh paper form.
export const defaultElementInventory = () => {
  const inv = {};
  ELEMENT_GROUPS.forEach((g) =>
    g.elements.forEach((e) => {
      inv[elemKey(g.key, e.key)] = { absent: false, obs: "" };
    })
  );
  return inv;
};

export const defaultAnalysis = () =>
  Object.fromEntries(ANALYSIS_FIELDS.map((f) => [f.key, ""]));

// --- Skeleton figure bone mapping -----------------------------------------
// Maps each inventory element to the bone group id(s) in the public-domain
// anatomical skeleton SVG (LadyofHats / Mariana Ruiz Villarreal, Wikimedia
// Commons, released into the public domain). Elements with no matching bone in
// the figure (teeth, hyoid, sesamoids, individual ribs) are omitted. Used by
// the Homunculus component and the backend PDF template.
const ARM_BONE_MAP = (side) => ({
  clavicle: [`Clavicle${side}`],
  scapula: ["Scapula"], // figure has a single shared scapula group
  humerus: [`Humerus${side}`],
  radius: [`Radius${side}`],
  ulna: [`Ulna${side}`],
  scaphoid: [`Carpals${side}`], lunate: [`Carpals${side}`], triquetral: [`Carpals${side}`],
  pisiform: [`Carpals${side}`], hamate: [`Carpals${side}`], capitate: [`Carpals${side}`],
  trapezoid: [`Carpals${side}`], trapezium: [`Carpals${side}`],
  metacarpals: [`Metacarpals${side}`],
  phalanges_prox: [`Phalanges${side}`], phalanges_inter: [`Phalanges${side}`], phalanges_dist: [`Phalanges${side}`],
});
const LEG_BONE_MAP = (side) => ({
  innominate: ["PelvicGirdle"], // single shared pelvis group
  femur: [`Femur${side}`], patella: [`Patella${side}`], tibia: [`Tibia${side}`], fibula: [`Fibula${side}`],
  calcaneus: [`Tarsals${side}`], talus: [`Tarsals${side}`], navicular: [`Tarsals${side}`], cuboid: [`Tarsals${side}`],
  med_cuneiform: [`Tarsals${side}`], int_cuneiform: [`Tarsals${side}`], lat_cuneiform: [`Tarsals${side}`],
  metatarsals: [`Metatarsals${side}`],
  phalanges_prox: [`PhalangesFoot${side}`], phalanges_inter: [`PhalangesFoot${side}`], phalanges_dist: [`PhalangesFoot${side}`],
});
export const BONE_SVG_MAP = {
  cranium: { vault: ["Cranium"], basicranium: ["Cranium"], facial: ["Cranium"], mandible: ["Mandible"] },
  axial: {
    c1: ["CervicalVertebrae"], c2: ["CervicalVertebrae"], c3_7: ["CervicalVertebrae"],
    t1: ["ThoracicVertebrae"], t2_9: ["ThoracicVertebrae"], t10_12: ["ThoracicVertebrae"],
    l1_4: ["LumbarVertebrae"], l5: ["LumbarVertebrae"], sacrum: ["Sacrum"],
  },
  left_arm: ARM_BONE_MAP("Left"),
  right_arm: ARM_BONE_MAP("Right"),
  left_leg: LEG_BONE_MAP("Left"),
  right_leg: LEG_BONE_MAP("Right"),
  other: { sternum: ["Sternum"] },
};

// Returns the set of figure bone ids that should render as "absent" — a bone is
// absent only when every inventory element mapped to it is explicitly marked
// absent (so unrecorded/legacy donors don't redden the whole skeleton).
export const absentBoneIds = (inventory = {}) => {
  const tracked = new Set();
  const present = new Set();
  for (const [groupKey, emap] of Object.entries(BONE_SVG_MAP)) {
    for (const [elementKey, ids] of Object.entries(emap)) {
      const cell = inventory[elemKey(groupKey, elementKey)];
      const isPresent = cell ? !cell.absent : true;
      ids.forEach((id) => {
        tracked.add(id);
        if (isPresent) present.add(id);
      });
    }
  }
  return [...tracked].filter((id) => !present.has(id));
};

export const ABSENT_FILL = "#c0392b";
export const ABSENT_STROKE = "#7b241c";

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

// --- Homunculus region map ------------------------------------------------
// A schematic (not anatomically precise) body diagram. Each region shades as
// "present" when at least one of its mapped elements is present. `shape` is an
// SVG element descriptor consumed by the Homunculus component.
export const HOMUNCULUS_REGIONS = [
  { id: "skull",     label: "Cranium",   shape: { type: "ellipse", cx: 100, cy: 34, rx: 26, ry: 30 },
    elements: [["cranium", "vault"], ["cranium", "basicranium"], ["cranium", "facial"]] },
  { id: "mandible",  label: "Mandible",  shape: { type: "ellipse", cx: 100, cy: 64, rx: 18, ry: 9 },
    elements: [["cranium", "mandible"]] },
  { id: "spine",     label: "Spine",     shape: { type: "rect", x: 94, y: 74, w: 12, h: 120, rx: 5 },
    elements: [["axial", "c3_7"], ["axial", "t2_9"], ["axial", "l1_4"], ["axial", "sacrum"]] },
  { id: "ribcage",   label: "Ribcage",   shape: { type: "rect", x: 66, y: 84, w: 68, h: 70, rx: 18 },
    elements: [["axial", "ribs_l"], ["axial", "ribs_r"]] },
  { id: "pelvis",    label: "Pelvis",    shape: { type: "rect", x: 74, y: 188, w: 52, h: 28, rx: 12 },
    elements: [["left_leg", "innominate"], ["right_leg", "innominate"], ["axial", "sacrum"]] },
  // Left side of the diagram = body's right (anatomical), but we label by the
  // group name for clarity.
  { id: "r_humerus", label: "R Humerus", shape: { type: "rect", x: 50, y: 90, w: 11, h: 64, rx: 5 },
    elements: [["right_arm", "humerus"]] },
  { id: "r_forearm", label: "R Forearm", shape: { type: "rect", x: 44, y: 154, w: 11, h: 58, rx: 5 },
    elements: [["right_arm", "radius"], ["right_arm", "ulna"]] },
  { id: "r_hand",    label: "R Hand",    shape: { type: "ellipse", cx: 46, cy: 222, rx: 9, ry: 12 },
    elements: [["right_arm", "metacarpals"], ["right_arm", "phalanges_prox"]] },
  { id: "l_humerus", label: "L Humerus", shape: { type: "rect", x: 139, y: 90, w: 11, h: 64, rx: 5 },
    elements: [["left_arm", "humerus"]] },
  { id: "l_forearm", label: "L Forearm", shape: { type: "rect", x: 145, y: 154, w: 11, h: 58, rx: 5 },
    elements: [["left_arm", "radius"], ["left_arm", "ulna"]] },
  { id: "l_hand",    label: "L Hand",    shape: { type: "ellipse", cx: 154, cy: 222, rx: 9, ry: 12 },
    elements: [["left_arm", "metacarpals"], ["left_arm", "phalanges_prox"]] },
  { id: "r_femur",   label: "R Femur",   shape: { type: "rect", x: 80, y: 218, w: 13, h: 80, rx: 6 },
    elements: [["right_leg", "femur"]] },
  { id: "r_shank",   label: "R Tibia/Fibula", shape: { type: "rect", x: 80, y: 298, w: 13, h: 78, rx: 6 },
    elements: [["right_leg", "tibia"], ["right_leg", "fibula"]] },
  { id: "r_foot",    label: "R Foot",    shape: { type: "ellipse", cx: 86, cy: 388, rx: 12, ry: 9 },
    elements: [["right_leg", "calcaneus"], ["right_leg", "talus"], ["right_leg", "metatarsals"]] },
  { id: "l_femur",   label: "L Femur",   shape: { type: "rect", x: 107, y: 218, w: 13, h: 80, rx: 6 },
    elements: [["left_leg", "femur"]] },
  { id: "l_shank",   label: "L Tibia/Fibula", shape: { type: "rect", x: 107, y: 298, w: 13, h: 78, rx: 6 },
    elements: [["left_leg", "tibia"], ["left_leg", "fibula"]] },
  { id: "l_foot",    label: "L Foot",    shape: { type: "ellipse", cx: 114, cy: 388, rx: 12, ry: 9 },
    elements: [["left_leg", "calcaneus"], ["left_leg", "talus"], ["left_leg", "metatarsals"]] },
];

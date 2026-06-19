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
// An anatomically-suggestive front-view skeleton. Each region shades as
// "present" when at least one of its mapped elements is present. `shape` is a
// descriptor — "path" (raw SVG path), or "bone" (a long bone with knobby
// epiphyses; `double` draws a parallel pair, e.g. radius/ulna). Consumed by
// the Homunculus component and the backend PDF template, which share this map.
// The diagram's left side is the body's anatomical right; regions are labelled
// by their group name for clarity.
export const HOMUNCULUS_REGIONS = [
  { id: "skull",     label: "Cranium",  shape: { type: "path", d: "M100 9 C82 9 70 23 70 39 C70 51 78 60 100 62 C122 60 130 51 130 39 C130 23 118 9 100 9 Z" },
    elements: [["cranium", "vault"], ["cranium", "basicranium"], ["cranium", "facial"]] },
  { id: "mandible",  label: "Mandible", shape: { type: "path", d: "M79 56 C84 71 116 71 121 56 C117 67 109 72 100 72 C91 72 83 67 79 56 Z" },
    elements: [["cranium", "mandible"]] },
  { id: "spine",     label: "Spine",    shape: { type: "path", d: "M96 62 L104 62 L106 196 L94 196 Z" },
    elements: [["axial", "c3_7"], ["axial", "t2_9"], ["axial", "l1_4"], ["axial", "sacrum"]] },
  { id: "ribcage",   label: "Ribcage",  shape: { type: "path", d: "M100 80 C74 82 66 104 68 128 C70 150 84 166 100 168 C116 166 130 150 132 128 C134 104 126 82 100 80 Z" },
    elements: [["axial", "ribs_l"], ["axial", "ribs_r"]] },
  { id: "pelvis",    label: "Pelvis",   shape: { type: "path", d: "M70 188 C68 206 82 222 100 220 C118 222 132 206 130 188 C122 200 110 202 100 200 C90 202 78 200 70 188 Z" },
    elements: [["left_leg", "innominate"], ["right_leg", "innominate"], ["axial", "sacrum"]] },
  { id: "r_humerus", label: "R Humerus", shape: { type: "bone", x: 46, y: 90, w: 14, h: 66 },
    elements: [["right_arm", "humerus"]] },
  { id: "r_forearm", label: "R Forearm", shape: { type: "bone", x: 40, y: 158, w: 16, h: 58, double: true },
    elements: [["right_arm", "radius"], ["right_arm", "ulna"]] },
  { id: "r_hand",    label: "R Hand",    shape: { type: "path", d: "M36 218 q-3 13 3 22 q9 7 15 -1 q4 -11 0 -21 q-3 6 -9 6 q-6 0 -9 -6 Z" },
    elements: [["right_arm", "metacarpals"], ["right_arm", "phalanges_prox"]] },
  { id: "l_humerus", label: "L Humerus", shape: { type: "bone", x: 140, y: 90, w: 14, h: 66 },
    elements: [["left_arm", "humerus"]] },
  { id: "l_forearm", label: "L Forearm", shape: { type: "bone", x: 144, y: 158, w: 16, h: 58, double: true },
    elements: [["left_arm", "radius"], ["left_arm", "ulna"]] },
  { id: "l_hand",    label: "L Hand",    shape: { type: "path", d: "M149 218 q-3 13 3 22 q9 7 15 -1 q4 -11 0 -21 q-3 6 -9 6 q-6 0 -9 -6 Z" },
    elements: [["left_arm", "metacarpals"], ["left_arm", "phalanges_prox"]] },
  { id: "r_femur",   label: "R Femur",   shape: { type: "bone", x: 79, y: 216, w: 15, h: 88 },
    elements: [["right_leg", "femur"]] },
  { id: "r_shank",   label: "R Tibia/Fibula", shape: { type: "bone", x: 79, y: 306, w: 16, h: 78, double: true },
    elements: [["right_leg", "tibia"], ["right_leg", "fibula"]] },
  { id: "r_foot",    label: "R Foot",    shape: { type: "path", d: "M72 386 q-5 9 3 14 q15 5 24 -2 q3 -7 -4 -12 Z" },
    elements: [["right_leg", "calcaneus"], ["right_leg", "talus"], ["right_leg", "metatarsals"]] },
  { id: "l_femur",   label: "L Femur",   shape: { type: "bone", x: 106, y: 216, w: 15, h: 88 },
    elements: [["left_leg", "femur"]] },
  { id: "l_shank",   label: "L Tibia/Fibula", shape: { type: "bone", x: 105, y: 306, w: 16, h: 78, double: true },
    elements: [["left_leg", "tibia"], ["left_leg", "fibula"]] },
  { id: "l_foot",    label: "L Foot",    shape: { type: "path", d: "M104 386 q-3 9 4 14 q15 4 24 -3 q3 -6 -4 -11 Z" },
    elements: [["left_leg", "calcaneus"], ["left_leg", "talus"], ["left_leg", "metatarsals"]] },
];

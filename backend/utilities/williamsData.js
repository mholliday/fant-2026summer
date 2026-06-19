// williamsData.js (CommonJS)
// Backend copy of the Williams analysis-form definitions used by the PDF
// template. Mirrors frontend/src/services/williamsForm.js (kept separate
// because the frontend is ESM and this runs under CommonJS).

const ANALYSIS_FIELDS = [
  { key: "cil",          label: "CIL" },
  { key: "analyst",      label: "Analyst" },
  { key: "signature",    label: "Signature / Initials" },
  { key: "date_started", label: "Date Analysis Started" },
  { key: "date_ended",   label: "Date Analysis Ended" },
  { key: "instruments",  label: "Instruments / Equipment Used (Type & ID#)" },
  { key: "exemplars",    label: "Exemplars Used" },
];

const ARM_ELEMENTS = [
  ["clavicle", "Clavicle"], ["scapula", "Scapula"], ["humerus", "Humerus"],
  ["radius", "Radius"], ["ulna", "Ulna"], ["scaphoid", "Scaphoid"],
  ["lunate", "Lunate"], ["triquetral", "Triquetral"], ["pisiform", "Pisiform"],
  ["hamate", "Hamate"], ["capitate", "Capitate"], ["trapezoid", "Trapezoid"],
  ["trapezium", "Trapezium"], ["metacarpals", "Metacarpals"],
  ["phalanges_prox", "Phalanges — Proximal"],
  ["phalanges_inter", "Phalanges — Intermediate"],
  ["phalanges_dist", "Phalanges — Distal"],
].map(([key, label]) => ({ key, label }));

const LEG_ELEMENTS = [
  ["innominate", "Innominate"], ["femur", "Femur"], ["patella", "Patella"],
  ["tibia", "Tibia"], ["fibula", "Fibula"], ["calcaneus", "Calcaneus"],
  ["talus", "Talus"], ["navicular", "Navicular"], ["cuboid", "Cuboid"],
  ["med_cuneiform", "Medial Cuneiform"], ["int_cuneiform", "Intermediate Cuneiform"],
  ["lat_cuneiform", "Lateral Cuneiform"], ["metatarsals", "Metatarsals"],
  ["phalanges_prox", "Phalanges — Proximal"],
  ["phalanges_inter", "Phalanges — Intermediate"],
  ["phalanges_dist", "Phalanges — Distal"],
].map(([key, label]) => ({ key, label }));

const ELEMENT_GROUPS = [
  { key: "cranium", label: "Cranium", elements: [
    ["vault", "Vault"], ["basicranium", "Basicranium"], ["facial", "Facial"],
    ["mandible", "Mandible"], ["teeth", "Teeth"],
  ].map(([key, label]) => ({ key, label })) },
  { key: "axial", label: "Axial Skeleton", elements: [
    ["c1", "C1"], ["c2", "C2"], ["c3_7", "C3–7"], ["t1", "T1"], ["t2_9", "T2–9"],
    ["t10_12", "T10–12"], ["l1_4", "L1–4"], ["l5", "L5"], ["sacrum", "Sacrum"],
    ["ribs_l", "L Ribs"], ["ribs_r", "R Ribs"], ["ribs_unsided", "Unsided Ribs"],
  ].map(([key, label]) => ({ key, label })) },
  { key: "left_arm", label: "Left Arm", elements: ARM_ELEMENTS },
  { key: "right_arm", label: "Right Arm", elements: ARM_ELEMENTS },
  { key: "left_leg", label: "Left Leg", elements: LEG_ELEMENTS },
  { key: "right_leg", label: "Right Leg", elements: LEG_ELEMENTS },
  { key: "other", label: "Other", elements: [
    ["hyoid", "Hyoid"], ["sternum", "Sternum"], ["sesamoids", "Sesamoids"],
  ].map(([key, label]) => ({ key, label })) },
];

const elemKey = (groupKey, elementKey) => `${groupKey}__${elementKey}`;

// Anatomically-suggestive front-view skeleton. Shapes: "path" (raw SVG path)
// or "bone" (long bone with knobby ends; `double` = parallel pair). Mirrors
// HOMUNCULUS_REGIONS in frontend/src/services/williamsForm.js.
const HOMUNCULUS_REGIONS = [
  { shape: { type: "path", d: "M100 9 C82 9 70 23 70 39 C70 51 78 60 100 62 C122 60 130 51 130 39 C130 23 118 9 100 9 Z" }, elements: [["cranium", "vault"], ["cranium", "basicranium"], ["cranium", "facial"]] },
  { shape: { type: "path", d: "M79 56 C84 71 116 71 121 56 C117 67 109 72 100 72 C91 72 83 67 79 56 Z" }, elements: [["cranium", "mandible"]] },
  { shape: { type: "path", d: "M96 62 L104 62 L106 196 L94 196 Z" }, elements: [["axial", "c3_7"], ["axial", "t2_9"], ["axial", "l1_4"], ["axial", "sacrum"]] },
  { shape: { type: "path", d: "M100 80 C74 82 66 104 68 128 C70 150 84 166 100 168 C116 166 130 150 132 128 C134 104 126 82 100 80 Z" }, elements: [["axial", "ribs_l"], ["axial", "ribs_r"]] },
  { shape: { type: "path", d: "M70 188 C68 206 82 222 100 220 C118 222 132 206 130 188 C122 200 110 202 100 200 C90 202 78 200 70 188 Z" }, elements: [["left_leg", "innominate"], ["right_leg", "innominate"], ["axial", "sacrum"]] },
  { shape: { type: "bone", x: 46, y: 90, w: 14, h: 66 }, elements: [["right_arm", "humerus"]] },
  { shape: { type: "bone", x: 40, y: 158, w: 16, h: 58, double: true }, elements: [["right_arm", "radius"], ["right_arm", "ulna"]] },
  { shape: { type: "path", d: "M36 218 q-3 13 3 22 q9 7 15 -1 q4 -11 0 -21 q-3 6 -9 6 q-6 0 -9 -6 Z" }, elements: [["right_arm", "metacarpals"], ["right_arm", "phalanges_prox"]] },
  { shape: { type: "bone", x: 140, y: 90, w: 14, h: 66 }, elements: [["left_arm", "humerus"]] },
  { shape: { type: "bone", x: 144, y: 158, w: 16, h: 58, double: true }, elements: [["left_arm", "radius"], ["left_arm", "ulna"]] },
  { shape: { type: "path", d: "M149 218 q-3 13 3 22 q9 7 15 -1 q4 -11 0 -21 q-3 6 -9 6 q-6 0 -9 -6 Z" }, elements: [["left_arm", "metacarpals"], ["left_arm", "phalanges_prox"]] },
  { shape: { type: "bone", x: 79, y: 216, w: 15, h: 88 }, elements: [["right_leg", "femur"]] },
  { shape: { type: "bone", x: 79, y: 306, w: 16, h: 78, double: true }, elements: [["right_leg", "tibia"], ["right_leg", "fibula"]] },
  { shape: { type: "path", d: "M72 386 q-5 9 3 14 q15 5 24 -2 q3 -7 -4 -12 Z" }, elements: [["right_leg", "calcaneus"], ["right_leg", "talus"], ["right_leg", "metatarsals"]] },
  { shape: { type: "bone", x: 106, y: 216, w: 15, h: 88 }, elements: [["left_leg", "femur"]] },
  { shape: { type: "bone", x: 105, y: 306, w: 16, h: 78, double: true }, elements: [["left_leg", "tibia"], ["left_leg", "fibula"]] },
  { shape: { type: "path", d: "M104 386 q-3 9 4 14 q15 4 24 -3 q3 -6 -4 -11 Z" }, elements: [["left_leg", "calcaneus"], ["left_leg", "talus"], ["left_leg", "metatarsals"]] },
];

// Osteometry groups (label + flat keys) mirroring the frontend OSTEOMETRY_FIELDS.
const OSTEOMETRY_FIELDS = {
  Cranium: [
    ["maximum_cranial_length", "Max. Cranial Length (GOL)"], ["maximum_cranial_breadth", "Max. Cranial Breadth (XCB)"],
    ["basion_bregma_height", "Basion-Bregma Height (BBH)"], ["bizygomatic_breadth", "Bizygomatic Breadth (ZYB)"],
    ["cranial_base_length", "Cranial Base Length (BNL)"], ["basion_prosthion_length", "Basion-Prosthion Length (BPL)"],
    ["maxilloalveolar_breadth", "Maxillo-Alveolar Breadth (MAB)"], ["maxilloalveolar_length", "Maxillo-Alveolar Length (MAL)"],
    ["biauricular_breadth", "Biauricular Breadth (AUB)"], ["upper_facial_height", "Upper Facial Height (UFHT)"],
    ["min_frontal_breadth", "Min. Frontal Breadth (WFB)"], ["upper_facial_breadth", "Upper Facial Breadth (UFBR)"],
    ["nasal_height", "Nasal Height (NLH)"], ["nasal_breadth", "Nasal Breadth (NLB)"],
    ["orbital_height", "Orbital Height (OBH)"], ["orbital_breadth", "Orbital Breadth (OBB)"],
    ["interorbital_breadth", "Interorbital Breadth (DKB)"], ["biorbital_breadth", "Biorbital Breadth (EKB)"],
    ["frontal_chord", "Frontal Chord (FRC)"], ["parietal_chord", "Parietal Chord (PAC)"],
    ["occipital_chord", "Occipital Chord (OCC)"], ["foramen_magnum_length", "Foramen Magnum Length (FOL)"],
    ["foramen_magnum_breadth", "Foramen Magnum Breadth (FOB)"], ["mastoid_length", "Mastoid Length (MDH)"],
  ],
  Mandible: [
    ["mandible_length", "Mandible Length"], ["bicondylar_breadth", "Bicondylar Breadth (CDB)"],
    ["bigonial_breadth", "Bigonial Breadth (GOG)"], ["chin_height", "Chin Height (GNI)"],
    ["mandibular_body_height", "Mandibular Body Height (HMF)"], ["mandibular_body_breadth", "Mandibular Body Breadth (TMF)"],
    ["symphysis_height", "Symphysis Height"], ["min_ramus_breadth", "Min. Ramus Breadth (WRB)"],
    ["max_ramus_breadth", "Max. Ramus Breadth (XRB)"], ["ramus_height", "Ramus Height"],
  ],
  Clavicle: [
    ["clavicle_max_length", "Maximum Length (XLN)"], ["clavicle_ap_diameter", "A-P Diameter Midshaft (APD)"],
    ["clavicle_si_diameter", "S-I Diameter Midshaft (VRD)"],
  ],
  Scapula: [
    ["scapula_height", "Anatomical Height (PHT)"], ["scapula_breadth", "Anatomical Breadth (PBR)"],
    ["glenoid_height", "Glenoid Cavity Height"], ["glenoid_breadth", "Glenoid Cavity Breadth"],
  ],
  Humerus: [
    ["humerus_max_length", "Maximum Length (XLN)"], ["humerus_epicondylar_width", "Epicondylar Breadth (EBR)"],
    ["humerus_head_diameter", "Head Diameter (HDD)"], ["humerus_max_diam_midshaft", "Max. Diam. Midshaft (MXD)"],
    ["humerus_min_diam_midshaft", "Min. Diam. Midshaft (MWD)"],
  ],
  Radius: [
    ["radius_max_length", "Maximum Length (XLN)"], ["radius_sagittal_diameter", "A-P Diameter Midshaft (APD)"],
    ["radius_transverse_diameter", "M-L Diameter Midshaft (TVD)"],
  ],
  Ulna: [
    ["ulna_max_length", "Maximum Length (XLN)"], ["ulna_physiological_length", "Physiological Length"],
    ["ulna_dorso_volar_diam", "Dorso-Volar Diameter (DVD)"], ["ulna_transverse_diam", "Transverse Diameter (TVD)"],
  ],
  Sacrum: [
    ["sacrum_ant_height", "Anterior Height (AHT)"], ["sacrum_ant_sup_breadth", "Ant.-Sup. Breadth (ABR)"],
    ["sacrum_s1_breadth", "Max. Trans. Diam. Base S1 (S1B)"],
  ],
  "Os Coxa": [
    ["os_coxa_height", "Innominate Height (OHT)"], ["iliac_breadth", "Iliac Breadth (ABR)"],
    ["pubis_length", "Pubis Length"], ["ischium_length", "Ischium Length"],
  ],
  Femur: [
    ["femur_max_length", "Maximum Length (XLN)"], ["femur_bicondylar_length", "Bicondylar Length (BLN)"],
    ["femur_epicondylar_breadth", "Epicondylar Breadth (EBR)"], ["femur_head_diameter", "Head Diameter (HDD)"],
    ["femur_ap_subtrochanteric", "A-P Subtrochanteric (SAP)"], ["femur_ml_subtrochanteric", "M-L Subtrochanteric (STV)"],
    ["femur_ap_midshaft", "A-P Midshaft (MAP)"], ["femur_ml_midshaft", "M-L Midshaft (MTV)"],
    ["femur_midshaft_circ", "Midshaft Circumference"], ["femur_bicondylar_width", "Distal Bicondylar Width"],
  ],
  Tibia: [
    ["tibia_max_length", "Maximum Length (XLN)"], ["tibia_prox_epiphyseal", "Max. Prox. Epiph. Breadth (PEB)"],
    ["tibia_dist_epiphyseal", "Max. Dist. Epiph. Breadth (DEB)"], ["tibia_ap_nutrient_foramen", "A-P at Nutrient For. (NFX)"],
    ["tibia_ml_nutrient_foramen", "M-L at Nutrient For. (NFT)"], ["tibia_midshaft_circ", "Midshaft Circumference"],
    ["tibia_distal_breadth", "Distal Breadth"],
  ],
  Fibula: [
    ["fibula_max_length", "Maximum Length (XLN)"], ["fibula_max_diam_midshaft", "Max. Diam. Midshaft (MDM)"],
  ],
  Calcaneus: [
    ["calcaneus_max_length", "Maximum Length (CXL)"], ["calcaneus_middle_breadth", "Middle Breadth (CBR)"],
  ],
  Talus: [
    ["talus_max_length", "Maximum Length"], ["talus_max_breadth", "Maximum Breadth"],
  ],
};

module.exports = {
  ANALYSIS_FIELDS,
  ELEMENT_GROUPS,
  HOMUNCULUS_REGIONS,
  OSTEOMETRY_FIELDS,
  elemKey,
};

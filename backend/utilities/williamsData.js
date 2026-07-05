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

// Element order within each arm/leg follows the Williams .docx exactly.
const ARM_ELEMENTS = [
  ["clavicle", "Clavicle"], ["scapula", "Scapula"], ["humerus", "Humerus"],
  ["radius", "Radius"], ["ulna", "Ulna"], ["hamate", "Hamate"],
  ["capitate", "Capitate"], ["pisiform", "Pisiform"], ["lunate", "Lunate"],
  ["trapezoid", "Trapezoid"], ["trapezium", "Trapezium"], ["triquetral", "Triquetral"],
  ["scaphoid", "Scaphoid"], ["metacarpals", "Metacarpals"],
  ["phalanges_prox", "Phalanges — Proximal"],
  ["phalanges_inter", "Phalanges — Intermediate"],
  ["phalanges_dist", "Phalanges — Distal"],
].map(([key, label]) => ({ key, label }));

const LEG_ELEMENTS = [
  ["innominate", "Innominate"], ["femur", "Femur"], ["patella", "Patella"],
  ["tibia", "Tibia"], ["fibula", "Fibula"], ["cuboid", "Cuboid"],
  ["talus", "Talus"], ["calcaneus", "Calcaneus"], ["navicular", "Navicular"],
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
  { key: "left_leg", label: "Left Leg", elements: LEG_ELEMENTS },
  { key: "right_arm", label: "Right Arm", elements: ARM_ELEMENTS },
  { key: "right_leg", label: "Right Leg", elements: LEG_ELEMENTS },
  { key: "other", label: "Other", elements: [
    ["hyoid", "Hyoid"], ["sternum", "Sternum"], ["sesamoids", "Sesamoids"],
  ].map(([key, label]) => ({ key, label })) },
];

const elemKey = (groupKey, elementKey) => `${groupKey}__${elementKey}`;

// Maps each inventory element to bone group id(s) in the public-domain
// skeleton SVG (LadyofHats, Wikimedia Commons). Mirrors BONE_SVG_MAP in
// frontend/src/services/williamsForm.js.
const armBoneMap = (side) => ({
  clavicle: [`Clavicle${side}`], scapula: ["Scapula"], humerus: [`Humerus${side}`],
  radius: [`Radius${side}`], ulna: [`Ulna${side}`],
  scaphoid: [`Carpals${side}`], lunate: [`Carpals${side}`], triquetral: [`Carpals${side}`],
  pisiform: [`Carpals${side}`], hamate: [`Carpals${side}`], capitate: [`Carpals${side}`],
  trapezoid: [`Carpals${side}`], trapezium: [`Carpals${side}`],
  metacarpals: [`Metacarpals${side}`],
  phalanges_prox: [`Phalanges${side}`], phalanges_inter: [`Phalanges${side}`], phalanges_dist: [`Phalanges${side}`],
});
const legBoneMap = (side) => ({
  innominate: ["PelvicGirdle"], femur: [`Femur${side}`], patella: [`Patella${side}`],
  tibia: [`Tibia${side}`], fibula: [`Fibula${side}`],
  calcaneus: [`Tarsals${side}`], talus: [`Tarsals${side}`], navicular: [`Tarsals${side}`], cuboid: [`Tarsals${side}`],
  med_cuneiform: [`Tarsals${side}`], int_cuneiform: [`Tarsals${side}`], lat_cuneiform: [`Tarsals${side}`],
  metatarsals: [`Metatarsals${side}`],
  phalanges_prox: [`PhalangesFoot${side}`], phalanges_inter: [`PhalangesFoot${side}`], phalanges_dist: [`PhalangesFoot${side}`],
});
const BONE_SVG_MAP = {
  cranium: { vault: ["Cranium"], basicranium: ["Cranium"], facial: ["Cranium"], mandible: ["Mandible"] },
  axial: {
    c1: ["CervicalVertebrae"], c2: ["CervicalVertebrae"], c3_7: ["CervicalVertebrae"],
    t1: ["ThoracicVertebrae"], t2_9: ["ThoracicVertebrae"], t10_12: ["ThoracicVertebrae"],
    l1_4: ["LumbarVertebrae"], l5: ["LumbarVertebrae"], sacrum: ["Sacrum"],
  },
  left_arm: armBoneMap("Left"),
  right_arm: armBoneMap("Right"),
  left_leg: legBoneMap("Left"),
  right_leg: legBoneMap("Right"),
  other: { sternum: ["Sternum"] },
};

const absentBoneIds = (inventory = {}) => {
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

// Osteometry groups (label + flat keys) mirroring the frontend OSTEOMETRY_FIELDS.
const OSTEOMETRY_FIELDS = {
  Cranium: [
    ["maximum_cranial_length", "Max. Cranial Length (GOL)"], ["maximum_cranial_breadth", "Max. Cranial Breadth (XCB)"],
    ["bizygomatic_breadth", "Bizygomatic Diameter (ZYB)"], ["basion_bregma_height", "Basion-Bregma Height (BBH)"],
    ["cranial_base_length", "Cranial Base Length (BNL)"], ["basion_prosthion_length", "Basion-Prosthion Length (BPL)"],
    ["maxilloalveolar_breadth", "Maxillo-Alveolar Breadth (MAB)"], ["maxilloalveolar_length", "Maxillo-Alveolar Length (MAL)"],
    ["biauricular_breadth", "Biauricular Breadth (AUB)"], ["upper_facial_height", "Upper Facial Height (UFHT)"],
    ["min_frontal_breadth", "Min. Frontal Breadth (WFB)"], ["upper_facial_breadth", "Upper Facial Breadth (UFBR)"],
    ["nasal_height", "Nasal Height (NLH)"], ["nasal_breadth", "Nasal Breadth (NLB)"],
    ["orbital_breadth", "Orbital Breadth (OBB)"], ["orbital_height", "Orbital Height (OBH)"],
    ["biorbital_breadth", "Biorbital Breadth (EKB)"], ["interorbital_breadth", "Interorbital Breadth (DKB)"],
    ["frontal_chord", "Frontal Chord (FRC)"], ["parietal_chord", "Parietal Chord (PAC)"],
    ["occipital_chord", "Occipital Chord (OCC)"], ["foramen_magnum_length", "Foramen Magnum Length (FOL)"],
    ["foramen_magnum_breadth", "Foramen Magnum Breadth (FOB)"], ["mastoid_length", "Mastoid Length (MDH)"],
  ],
  Mandible: [
    ["chin_height", "Chin Height (GNI)"], ["mandibular_body_height", "Mandibular Body Height (HMF)"],
    ["mandibular_body_breadth", "Mandibular Body Breadth (TMF)"], ["bigonial_breadth", "Bigonial Width (GOG)"],
    ["bicondylar_breadth", "Bicondylar Breadth (CDB)"], ["min_ramus_breadth", "Min. Ramus Breadth (WRB)"],
    ["max_ramus_breadth", "Max. Ramus Breadth (XRB)"],
    ["mandible_length", "Mandible Length"], ["symphysis_height", "Symphysis Height"], ["ramus_height", "Ramus Height"],
  ],
  Clavicle: [
    ["clavicle_max_length", "Maximum Length (XLN)"], ["clavicle_ap_diameter", "Ant.-Post. Diameter Midshaft (APD)"],
    ["clavicle_si_diameter", "S-I Diameter Midshaft (VRD)"],
  ],
  Scapula: [
    ["scapula_height", "Anatomical Height (PHT)"], ["scapula_breadth", "Anatomical Breadth (PBR)"],
    ["glenoid_height", "Glenoid Cavity Height"], ["glenoid_breadth", "Glenoid Cavity Breadth"],
  ],
  Humerus: [
    ["humerus_max_length", "Maximum Length (XLN)"], ["humerus_epicondylar_width", "Epicondylar Breadth (EBR)"],
    ["humerus_head_diameter", "Vertical Diameter of Head (HDD)"], ["humerus_max_diam_midshaft", "Max. Diam. Midshaft (MXD)"],
    ["humerus_min_diam_midshaft", "Min. Diam. Midshaft (MWD)"],
  ],
  Radius: [
    ["radius_max_length", "Maximum Length (XLN)"], ["radius_sagittal_diameter", "Ant.-Post. Diameter Midshaft (APD)"],
    ["radius_transverse_diameter", "Med.-Lat. Diameter Midshaft (TVD)"],
  ],
  Ulna: [
    ["ulna_max_length", "Maximum Length (XLN)"], ["ulna_dorso_volar_diam", "Dorso-Volar Diameter (DVD)"],
    ["ulna_transverse_diam", "Transverse Diameter (TVD)"], ["ulna_physiological_length", "Physiological Length"],
  ],
  Sacrum: [
    ["sacrum_ant_height", "Anterior Height (AHT)"], ["sacrum_ant_sup_breadth", "Ant.-Sup. Breadth (ABR)"],
    ["sacrum_s1_breadth", "Max. Trans. Diam. Base S1 (S1B)"],
  ],
  "Innominate (Pelvis)": [
    ["os_coxa_height", "Innominate Height (OHT)"], ["iliac_breadth", "Iliac Breadth (ABR)"],
    ["pubis_length", "Pubis Length"], ["ischium_length", "Ischium Length"],
  ],
  Femur: [
    ["femur_max_length", "Maximum Length (XLN)"], ["femur_bicondylar_length", "Bicondylar Length (BLN)"],
    ["femur_epicondylar_breadth", "Epicondylar Breadth (EBR)"], ["femur_head_diameter", "Maximum Diameter of Femoral Head (HDD)"],
    ["femur_ap_subtrochanteric", "Ant.-Post. Subtrochanteric (SAP)"], ["femur_ml_subtrochanteric", "Med.-Lat. Subtrochanteric (STV)"],
    ["femur_ap_midshaft", "Ant.-Post. Midshaft (MAP)"], ["femur_ml_midshaft", "Med.-Lat. Midshaft (MTV)"],
    ["femur_midshaft_circ", "Midshaft Circumference"], ["femur_bicondylar_width", "Distal Bicondylar Width"],
  ],
  Tibia: [
    ["tibia_max_length", "Maximum Condylo-Malleolar Length* (XLN)"], ["tibia_prox_epiphyseal", "Maximum Prox. Epiphyseal Breadth (PEB)"],
    ["tibia_dist_epiphyseal", "Maximum Dist. Epiphyseal Breadth (DEB)"], ["tibia_ap_nutrient_foramen", "Maximum Diameter at Nutrient Foramen (NFX)"],
    ["tibia_ml_nutrient_foramen", "Max. Med.-Lat. Diameter at Nutrient Foramen (NFT)"], ["tibia_midshaft_circ", "Midshaft Circumference"],
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
  BONE_SVG_MAP,
  absentBoneIds,
  OSTEOMETRY_FIELDS,
  elemKey,
};

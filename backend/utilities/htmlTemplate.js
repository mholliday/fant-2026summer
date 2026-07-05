// htmlTemplate.js — generates the donor inventory HTML for PDF export.
// Page 1: WCU Skeletal Inventory (identification, dentition, bone completeness).
// Page 2+: Williams analysis form (header, element present/absent, homunculus,
//          osteometry, notes).
//
// Bug fix: the previous version declared nested skeleton objects (sk.cranial,
// sk.upper_limbs, …) that never existed in the saved data (which is flat) and
// were never rendered, so exported PDFs contained no bone inventory at all.
// This version reads the same flat schema the UI uses.
const fs = require("fs");
const path = require("path");
const {
  ANALYSIS_FIELDS,
  ELEMENT_GROUPS,
  OSTEOMETRY_FIELDS,
  elemKey,
} = require("./williamsData");

// The two skeletal figures shown on the Williams page (each front + back view).
// Loaded once and inlined as base64 data URIs so they render in the PDF without
// depending on a base URL.
const loadImg = (file) => {
  try {
    return `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "..", "assets", file)).toString("base64")}`;
  } catch {
    return "";
  }
};
const SKELETAL_HOMUNCULUS_IMG = loadImg("skeletal_inventory_homunculus.png");
const TRAUMA_HOMUNCULUS_IMG = loadImg("trauma_homunculus.png");

// --- Flat skeletal-inventory schema (mirrors the UI) ----------------------
const SKULL_SINGLES = [["frontal","Frontal"],["occipital","Occipital"],["ethmoid","Ethmoid"],["vomer","Vomer"],["sphenoid","Sphenoid"],["mandible","Mandible"]];
const SKULL_BILATERAL = [["parietal","Parietal"],["temporal","Temporal"],["zygomatic","Zygomatic"],["palatine","Palatine"],["maxilla","Maxilla"],["nasal","Nasal"],["lacrimal","Lacrimal"]];
const AXIAL_SINGLES = [["hyoid","Hyoid"],["manubrium","Manubrium"],["sternal_body","Sternal Body"],["xiphoid","Xiphoid"],["sacrum","Sacrum"],["coccyx","Coccyx"]];
const GIRDLE_BILATERAL = [["clavicle","Clavicle"],["scapula","Scapula"],["ischium","Ischium"],["ilium","Ilium"],["pubis","Pubis"]];
const CARPAL_BONES = [["scaphoid","Scaphoid"],["lunate","Lunate"],["triquetral","Triquetral"],["pisiform","Pisiform"],["hamate","Hamate"],["capitate","Capitate"],["trapezoid","Trapezoid"],["trapezium","Trapezium"]];
const TARSAL_BONES = [["calcaneus","Calcaneus"],["talus","Talus"],["navicular","Navicular"],["cuboid","Cuboid"],["cuneiform1","Cuneiform I"],["cuneiform2","Cuneiform II"],["cuneiform3","Cuneiform III"],["patella","Patella"]];
const LONG_BONES = [["humerus","Humerus"],["radius","Radius"],["ulna","Ulna"],["femur","Femur"],["tibia","Tibia"],["fibula","Fibula"]];

const esc = (v) =>
  v == null ? "" : String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const code = (v) => (v ? esc(v) : "-");

const generateHtml = (donor) => {
  const d = donor?.data ?? {};
  const id = d.identification ?? {};
  const sk = d.skeleton ?? {};
  const teeth = d.dentition?.teeth ?? Array(32).fill("-");
  const notes = d.notes ?? {};
  const analysis = d.analysis ?? {};
  const inventory = d.element_inventory ?? {};
  const osteo = d.osteometry ?? {};

  // ---- Skeletal inventory bone tables (page 1) ----
  const singleCell = (k, label) => `<td class="bone"><span class="lbl">${label}</span><span class="v">${code(sk[k])}</span></td>`;
  const lrCell = (k, label) => `<td class="bone"><span class="lbl">${label}</span><span class="v">L ${code(sk[`${k}_l`])} / R ${code(sk[`${k}_r`])}</span></td>`;
  const rows = (cells, perRow) => {
    let out = "";
    for (let i = 0; i < cells.length; i += perRow) {
      out += `<tr>${cells.slice(i, i + perRow).join("")}</tr>`;
    }
    return out;
  };

  const longBoneRows = LONG_BONES.map(([b, label]) => {
    const c = (s) => `<td class="num">${code(sk[s])}</td>`;
    return `<tr><td class="lbl">${label}</td>
      ${c(`${b}_l`)}${c(`${b}_l_prox`)}${c(`${b}_l_dist`)}
      ${c(`${b}_r`)}${c(`${b}_r_prox`)}${c(`${b}_r_dist`)}</tr>`;
  }).join("");

  const metaRows = (prefix) => [1,2,3,4,5].map(i =>
    `<tr><td class="lbl">${prefix.toUpperCase()}${i}</td><td class="num">${code(sk[`${prefix}${i}_l`])}</td><td class="num">${code(sk[`${prefix}${i}_r`])}</td></tr>`
  ).join("");

  const vertebraeBlock = [
    ["Cervical", "c", 7], ["Thoracic", "t", 12], ["Lumbar", "l", 5],
  ].map(([label, p, n]) => {
    const cells = Array.from({ length: n }, (_, i) =>
      `<td class="bone"><span class="lbl">${p.toUpperCase()}${i+1}</span><span class="v">${code(sk[`${p}${i+1}`])}</span></td>`);
    return `<p class="subhead">${label}</p><table class="grid">${rows(cells, 8)}</table>`;
  }).join("");

  const ribRows = [1,2,3,4,5,6].map(i =>
    `<tr><td class="lbl">R${i}</td><td class="num">${code(sk[`rib${i}_l`])}</td><td class="num">${code(sk[`rib${i}_r`])}</td>
        <td class="lbl">R${i+6}</td><td class="num">${code(sk[`rib${i+6}_l`])}</td><td class="num">${code(sk[`rib${i+6}_r`])}</td></tr>`
  ).join("");

  // ---- Williams element present/absent table (page 2) ----
  const inventoryGroups = ELEMENT_GROUPS.map((group) => {
    const body = group.elements.map((el) => {
      const cell = inventory[elemKey(group.key, el.key)] ?? { absent: false, obs: "" };
      return `<tr><td class="lbl">${esc(el.label)}</td>
        <td class="num">${cell.absent ? "✗" : "•"}</td>
        <td>${esc(cell.obs)}</td></tr>`;
    }).join("");
    return `<table class="inv"><tr><th class="lbl">${esc(group.label)}</th><th class="num">P/A</th><th>Observations</th></tr>${body}</table>`;
  }).join("");

  // ---- Osteometry table ----
  const osteometryTables = Object.entries(OSTEOMETRY_FIELDS).map(([group, fields]) => {
    const body = fields.map(([k, label]) =>
      `<tr><td class="lbl">${esc(label)}</td><td class="num">${osteo[k] !== "" && osteo[k] != null ? esc(osteo[k]) : "-"}</td></tr>`
    ).join("");
    return `<table class="osteo"><tr><th class="lbl">${esc(group)}</th><th class="num">mm</th></tr>${body}</table>`;
  }).join("");

  const hasAnalysis = ANALYSIS_FIELDS.some((f) => analysis[f.key]);
  const analysisRows = ANALYSIS_FIELDS
    .filter((f) => analysis[f.key])
    .map((f) => `<tr><td class="lbl">${esc(f.label)}</td><td>${esc(analysis[f.key])}</td></tr>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Donor ${esc(donor.donorID)}</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #000; }
    .document { margin: 40px; }
    .header { display: flex; align-items: center; justify-content: space-between; }
    h2.title { text-align: center; flex: 1; margin: 0; }
    .donor-id { border: 1px solid #000; padding: 4px 8px; }
    .row p { display: inline-block; margin: 2px 14px 2px 0; }
    h3 { border-bottom: 1px solid #000; padding-bottom: 2px; margin: 14px 0 6px; }
    .subhead { font-weight: bold; margin: 6px 0 2px; }
    table { border-collapse: collapse; width: 100%; margin: 4px 0; }
    td, th { border: 1px solid #999; padding: 2px 4px; vertical-align: top; }
    th { background: #f0f0f0; }
    .num { text-align: center; width: 36px; }
    .lbl { font-weight: bold; }
    .bone .lbl { display: block; font-size: 7px; color: #555; font-weight: normal; }
    .bone .v { display: block; }
    .grid td { text-align: center; }
    .two-col { display: flex; gap: 12px; }
    .two-col > div { flex: 1; }
    .inv-wrap { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; }
    .inv { width: 48%; }
    .osteo { width: 31%; display: inline-table; vertical-align: top; margin-right: 1%; }
    .box { border: 1px solid #000; padding: 8px; margin-top: 4px; white-space: pre-wrap; }
    .pagebreak { page-break-before: always; }
    .legend span { display: inline-block; width: 10px; height: 10px; border: 1px solid #6c757d; vertical-align: middle; }
  </style>
</head>
<body>
<div class="document">

  <!-- PAGE 1: WCU Skeletal Inventory -->
  <div class="header">
    <h2 class="title">SKELETAL INVENTORY</h2>
    <span class="donor-id">Donor ID: ${esc(donor.donorID)}</span>
  </div>
  <div class="row">
    <p><b>Ancestry:</b> ${code(id.ancestry)}</p>
    <p><b>Sex:</b> ${code(id.sex)}</p>
    <p><b>Age:</b> ${code(id.age)}</p>
    <p><b>Autopsy:</b> ${id.autopsy ? "yes" : "no"}</p>
    <p><b>Condition:</b> ${code(id.condition)}</p>
    <p><b>Recorder:</b> ${code(sk.recorder)}</p>
    <p><b>Date:</b> ${code(sk.date)}</p>
  </div>

  <p class="subhead">Dentition <span style="font-weight:normal">(A=antemortem, P=postmortem, N=natural, D=dental work)</span></p>
  <table>
    <tr><td class="lbl">Upper (1–16)</td>${teeth.slice(0,16).map(t=>`<td class="num">${code(t)}</td>`).join("")}</tr>
    <tr><td class="lbl">Lower (32–17)</td>${teeth.slice(16,32).reverse().map(t=>`<td class="num">${code(t)}</td>`).join("")}</tr>
  </table>

  <h3>Skeletal Inventory <span style="font-size:7px;font-weight:normal">(1=100% · 2=99–75% · 3=74–25% · 4=&lt;25% · 5=absent)</span></h3>
  <p class="subhead">Cranial</p>
  <table class="grid">${rows(SKULL_SINGLES.map(([k,l])=>singleCell(k,l)), 6)}${rows(SKULL_BILATERAL.map(([k,l])=>lrCell(k,l)), 4)}</table>
  <p class="subhead">Axial</p>
  <table class="grid">${rows(AXIAL_SINGLES.map(([k,l])=>singleCell(k,l)), 6)}</table>
  <p class="subhead">Shoulder Girdle / Pelvis</p>
  <table class="grid">${rows(GIRDLE_BILATERAL.map(([k,l])=>lrCell(k,l)), 5)}</table>

  <p class="subhead">Long Bones</p>
  <table>
    <tr><th rowspan="2">Bone</th><th colspan="3">Left</th><th colspan="3">Right</th></tr>
    <tr><th>Overall</th><th>Prox</th><th>Dist</th><th>Overall</th><th>Prox</th><th>Dist</th></tr>
    ${longBoneRows}
  </table>

  <div class="two-col">
    <div><p class="subhead">Carpals</p><table class="grid">${rows(CARPAL_BONES.map(([k,l])=>lrCell(k,l)), 2)}</table></div>
    <div><p class="subhead">Tarsals</p><table class="grid">${rows(TARSAL_BONES.map(([k,l])=>lrCell(k,l)), 2)}</table></div>
  </div>

  <div class="two-col">
    <div><p class="subhead">Metacarpals</p><table><tr><th></th><th>L</th><th>R</th></tr>${metaRows("mc")}</table></div>
    <div><p class="subhead">Metatarsals</p><table><tr><th></th><th>L</th><th>R</th></tr>${metaRows("mt")}</table></div>
  </div>

  ${vertebraeBlock}

  <p class="subhead">Ribs ${sk.ribs_count ? `(count: ${esc(sk.ribs_count)})` : ""}</p>
  <table><tr><th>Rib</th><th>L</th><th>R</th><th>Rib</th><th>L</th><th>R</th></tr>${ribRows}</table>

  ${sk.comments ? `<p class="subhead">Comments</p><div class="box">${esc(sk.comments)}</div>` : ""}

  <!-- PAGE 2: Williams analysis form -->
  <div class="pagebreak"></div>
  <div class="header">
    <h2 class="title">WILLIAMS COLLECTION — INVENTORY &amp; ANALYSIS</h2>
    <span class="donor-id">Donor ID: ${esc(donor.donorID)}</span>
  </div>

  ${hasAnalysis ? `<h3>Analysis</h3><table>${analysisRows}</table>` : ""}

  <h3>Element Inventory</h3>
  <div class="inv-wrap">${inventoryGroups}</div>
  ${SKELETAL_HOMUNCULUS_IMG ? `<div style="text-align:center;margin-top:8px"><img src="${SKELETAL_HOMUNCULUS_IMG}" style="max-width:520px;height:auto" /></div>` : ""}

  ${notes.general_observations ? `<p class="subhead">General Observations</p><div class="box">${esc(notes.general_observations)}</div>` : ""}

  <div class="pagebreak"></div>
  <h3>Osteometry <span style="font-size:7px;font-weight:normal">(mm)</span></h3>
  <div>${osteometryTables}</div>

  ${notes.trauma_and_pathological_analysis ? `<p class="subhead">Trauma and Pathological Analysis</p><div class="box">${esc(notes.trauma_and_pathological_analysis)}</div>` : ""}
  ${notes.general_observations_2 ? `<p class="subhead">General Observations</p><div class="box">${esc(notes.general_observations_2)}</div>` : ""}

  ${TRAUMA_HOMUNCULUS_IMG ? `<div style="text-align:center;margin-top:8px"><img src="${TRAUMA_HOMUNCULUS_IMG}" style="max-width:520px;height:auto" /></div>` : ""}

  ${notes.continuation ? `<p class="subhead">Continuation to Skeletal Analysis</p><div class="box">${esc(notes.continuation)}</div>` : ""}

</div>
</body>
</html>`;
};

module.exports = { generateHtml };

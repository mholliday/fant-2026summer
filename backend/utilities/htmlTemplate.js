// htmlTemplate.js — generates the skeletal inventory HTML for PDF export.
// Kept from original with minor safety improvements (null-safe data access).
const generateHtml = (donor) => {
  const d = donor?.data ?? {};
  const id = d.identification ?? {};
  const sk = d.skeleton ?? {};
  const dent = d.dentition ?? {};
  const teeth = dent.teeth ?? Array(32).fill("-");
  const notes = d.notes ?? {};
  const cranial = sk.cranial ?? {};
  const upper = sk.upper_limbs ?? {};
  const lower = sk.lower_limbs ?? {};
  const thorax = sk.thorax ?? {};
  const other = sk.other ?? {};

  const lr = (obj) => `${obj?.left ?? "-"} | ${obj?.right ?? "-"}`;
  const val = (v) => v ?? "-";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Donor Form</title>
  <style>
    .document { margin: 65px 40px 30px 40px; }
    .header { display: flex; align-items: center; justify-content: space-between; }
    .title { text-align: center; }
    .donor-id { border: 1px solid black; padding: 5px; }
    .dentition { padding: 3px 0; }
    .dentition-table { border-collapse: collapse; margin: 3px 0; }
    .dentition-table th, .dentition-table td { border: 1px solid black; padding: 1px 11px; }
    .no-border { border-style: none !important; white-space: nowrap; }
    .row { margin: 7px 0 3px 0; }
    .row p { display: inline; margin: 0 11px; }
    .bone-table { margin: 3px 11px; }
    .space { padding: 0 25px; }
    .space2 { padding: 0 12px 0 11px; }
    .lr-lbl { font-style: italic; text-align: center; }
    .num { text-align: center; border: 1px solid black; width: 50px; }
    @media print { .pagebreak { page-break-before: always; } }
    .notes { margin: 30px 11px 0; }
    .box { border: 1px solid black; padding: 10px; margin-top: 5px; }
  </style>
</head>
<body>
<div class="document">
  <div class="header row">
    <h3 class="title">SKELETAL INVENTORY</h3>
    <p class="donor-id">Donor ID: ${val(donor.donorID)}</p>
  </div>
  <div>
    <div class="row">
      <p><b>Ancestry:</b> ${val(id.ancestry)}</p>
      <p><b>Sex:</b> ${val(id.sex)}</p>
      <p><b>Age:</b> ${val(id.age)}</p>
      <p><b>Recorder:</b> ${val(donor.modifiedBy)}</p>
      <p><b>Date:</b> ${donor.modificationTime ? new Date(donor.modificationTime).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}</p>
    </div>
    <div class="row">
      <p><b>Autopsy:</b> ${id.autopsy ? "yes" : "no"}</p>
      <p><b>Condition:</b> ${val(id.condition)}</p>
    </div>
  </div>
  <div class="dentition row">
    <p><b>Dentition:</b> A=antemortem absence, P=postmortem absence, N=natural, D=dental work</p>
    <table class="dentition-table">
      <tr>
        <th class="no-border"></th>
        ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => `<th>${n}</th>`).join("")}
        <th class="no-border"></th>
      </tr>
      <tr>
        <td class="no-border">Upper Right</td>
        ${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => `<td>${val(teeth[i])}</td>`).join("")}
        <td class="no-border">Upper Left</td>
      </tr>
      <tr>
        <td class="no-border">Lower Right</td>
        ${[31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16].map(i => `<td>${val(teeth[i])}</td>`).join("")}
        <td class="no-border">Lower Left</td>
      </tr>
      <tr>
        <th class="no-border"></th>
        ${[32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17].map(n => `<th>${n}</th>`).join("")}
        <th class="no-border"></th>
      </tr>
    </table>
  </div>
  ${notes.general_observations || notes.trauma_and_pathological_analysis
    ? `<div class="pagebreak"></div>
       <div class="notes">
         <h3>Notes</h3>
         ${notes.general_observations ? `General Observations:<p class="box">${notes.general_observations}</p>` : ""}
         ${notes.trauma_and_pathological_analysis ? `Trauma and Pathological Analysis:<p class="box">${notes.trauma_and_pathological_analysis}</p>` : ""}
       </div>`
    : ""}
</div>
</body>
</html>`;
};

module.exports = { generateHtml };

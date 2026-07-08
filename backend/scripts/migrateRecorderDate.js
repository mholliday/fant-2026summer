/**
 * One-time migration: copy legacy skeleton.recorder / skeleton.date into
 * identification.recorder / identification.date.
 *
 * Background: the SKELETAL INVENTORY header (Recorder + Date) used to live under
 * `data.skeleton`; it now lives under `data.identification`. This backfills every
 * Version document so historical records show those values in the new location.
 *
 * Idempotent + non-destructive:
 *   - only writes when the source (skeleton) value is a non-empty string
 *   - only writes when the destination (identification) value is empty/missing
 *   - leaves the original skeleton.recorder/date in place (no data removed)
 *
 * Usage (from backend/):  node scripts/migrateRecorderDate.js [--dry-run]
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Version = require("../models/Version");

const DRY_RUN = process.argv.includes("--dry-run");
const FIELDS = ["recorder", "date"];

const nonEmpty = (v) => typeof v === "string" && v.trim() !== "";

async function main() {
  if (!process.env.FANT_DB_URI) {
    throw new Error("FANT_DB_URI is not set (check backend/.env)");
  }

  await mongoose.connect(process.env.FANT_DB_URI);
  console.log(`Connected. ${DRY_RUN ? "(DRY RUN — no writes)" : ""}`);

  const cursor = Version.find({}).cursor();
  let scanned = 0;
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned++;
    const data = doc.versionData;
    if (!data || typeof data !== "object") continue;

    const skeleton = data.skeleton;
    const identification = data.identification;
    if (!skeleton || typeof skeleton !== "object") continue;
    if (!identification || typeof identification !== "object") continue;

    const setOps = {};
    for (const field of FIELDS) {
      const src = skeleton[field];
      const dst = identification[field];
      if (nonEmpty(src) && !nonEmpty(dst)) {
        setOps[`versionData.identification.${field}`] = src;
      }
    }

    if (Object.keys(setOps).length === 0) continue;

    updated++;
    console.log(
      `  ${doc.donorID} / ${doc.versionID}: ${Object.entries(setOps)
        .map(([k, v]) => `${k.split(".").pop()}="${v}"`)
        .join(", ")}`
    );

    if (!DRY_RUN) {
      await Version.updateOne({ _id: doc._id }, { $set: setOps });
    }
  }

  console.log(
    `\nDone. Scanned ${scanned} version(s); ${DRY_RUN ? "would update" : "updated"} ${updated}.`
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});

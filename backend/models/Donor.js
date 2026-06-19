/**
 * Donor model
 * Replaces the raw MongoDB collection approach with a Mongoose schema.
 */
const mongoose = require("mongoose");

const DonorSchema = new mongoose.Schema(
  {
    donorID: { type: String, required: true, unique: true, index: true },
    currentVersion: { type: String, required: true },
    numVersions: { type: Number, required: true, default: 1 },
    archived: { type: Boolean, required: true, default: false },
    creationTime: { type: Date, required: true, default: Date.now },
    createdBy: { type: String, required: true }, // userID
    versions: { type: [String], required: true }, // array of versionIDs
  },
  { versionKey: false }
);

module.exports = mongoose.model("Donor", DonorSchema, "donors");

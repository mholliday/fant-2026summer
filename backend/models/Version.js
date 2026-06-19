const mongoose = require("mongoose");

const VersionSchema = new mongoose.Schema(
  {
    donorID: { type: String, required: true, index: true },
    versionID: { type: String, required: true, unique: true, index: true },
    modificationTime: { type: Date, required: true, default: Date.now },
    modifiedBy: { type: String, required: true }, // userID
    versionData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Version", VersionSchema, "versions");

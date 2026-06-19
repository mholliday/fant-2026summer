const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    access: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", UserSchema, "users");

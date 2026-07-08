/**
 * Seed the first super-admin user.
 *
 * The API can't bootstrap the first admin: creating a user requires an
 * authenticated admin, there's no public registration, and the API caps
 * new users at access <= 7. A super-admin (access = 15, immutable) must
 * therefore be inserted directly. Run this once against a fresh database.
 *
 * Usage:
 *   npm run seed:admin            (from backend/, uses .env)
 *   docker compose exec backend npm run seed:admin
 *
 * Reads ADMIN_USERNAME / ADMIN_PASSWORD and BONES_DB_URI from the env.
 * Idempotent: does nothing if the username already exists.
 */
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const User = require("../models/User");

const SUPER_ADMIN_ACCESS = 15;

/**
 * Ensure the admin user exists. Assumes a Mongoose connection is already open.
 * Skips silently if ADMIN_USERNAME or ADMIN_PASSWORD are not set.
 */
async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) return;

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`Admin "${username}" already exists — nothing to do.`);
    return;
  }

  const hashedPass = await bcrypt.hash(password, 10);
  await User.create({
    userID: uuid(),
    username,
    firstName: "Site",
    lastName: "Admin",
    password: hashedPass,
    access: SUPER_ADMIN_ACCESS,
  });

  console.log(`Seeded super-admin "${username}" (access=${SUPER_ADMIN_ACCESS}).`);
  console.log("Change this password after first login.");
}

module.exports = { ensureAdmin };

if (require.main === module) {
  const uri = process.env.BONES_DB_URI;
  if (!uri) {
    console.error("BONES_DB_URI is not set");
    process.exit(1);
  }
  mongoose
    .connect(uri)
    .then(() => ensureAdmin())
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err.message);
      mongoose.disconnect().finally(() => process.exit(1));
    });
}

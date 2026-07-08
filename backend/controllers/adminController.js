/**
 * adminController — database backup and restore.
 * Backup:  GET  /api/v2/admin/backup  -> downloads a JSON file of all collections.
 * Restore: POST /api/v2/admin/restore -> replaces all collections from a JSON body.
 */
const Donor   = require('../models/Donor');
const Version = require('../models/Version');
const User    = require('../models/User');

const backup = async (req, res) => {
  try {
    const [donors, versions, users] = await Promise.all([
      Donor.find({}).lean(),
      Version.find({}).lean(),
      User.find({}).lean(),
    ]);

    const payload = JSON.stringify({ donors, versions, users }, null, 2);
    const filename = 'fant-backup-' + new Date().toISOString().slice(0, 10) + '.json';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(payload);
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ message: 'Backup failed' });
  }
};

const restore = async (req, res) => {
  try {
    const { donors, versions, users } = req.body;

    if (!donors || !versions || !users) {
      return res.status(400).json({ message: 'Invalid backup: missing donors, versions, or users' });
    }

    await Promise.all([
      Donor.deleteMany({}),
      Version.deleteMany({}),
      User.deleteMany({}),
    ]);

    await Promise.all([
      donors.length   ? Donor.insertMany(donors,     { ordered: false }) : Promise.resolve(),
      versions.length ? Version.insertMany(versions, { ordered: false }) : Promise.resolve(),
      users.length    ? User.insertMany(users,       { ordered: false }) : Promise.resolve(),
    ]);

    res.json({
      message: 'Restore complete',
      counts: { donors: donors.length, versions: versions.length, users: users.length },
    });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ message: 'Restore failed: ' + err.message });
  }
};

module.exports = { backup, restore };

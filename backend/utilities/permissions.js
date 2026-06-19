const read_bit  = 0x4;
const write_bit = 0x2;
const admin_bit = 0x1;
const mut_bit   = 0x8;

const extract = (level, mask, shift) => (level & mask) >> shift;

const canRead     = (level) => Boolean(extract(level, read_bit, 2));
const canWrite    = (level) => Boolean(extract(level, write_bit, 1));
const isAdmin     = (level) => Boolean(extract(level, admin_bit, 0));
const isImmutable = (level) => Boolean(extract(level, mut_bit, 3));

const accessLevelToString = (access) => ("0000" + access.toString(2)).slice(-4);

const canAccess = (needRead, needWrite, needAdmin, accessLevel) => {
  let ok = needRead  ? canRead(accessLevel)  : true;
  ok = ok && (needWrite ? canWrite(accessLevel) : true);
  ok = ok && (needAdmin ? isAdmin(accessLevel)  : true);
  return ok;
};

const createAccessLevel = (read, write, admin, immutable = false) => {
  let level = 0;
  if (read)      level += read_bit;
  if (write)     level += write_bit;
  if (admin)     level += admin_bit;
  if (immutable) level += mut_bit;
  return level;
};

module.exports = {
  isImmutable,
  canRead,
  canWrite,
  isAdmin,
  createAccessLevel,
  accessLevelToString,
  canAccess,
};

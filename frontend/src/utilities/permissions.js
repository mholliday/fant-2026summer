const read_bit  = 0x4;
const write_bit = 0x2;
const admin_bit = 0x1;
const mut_bit   = 0x8;

const extract = (level, mask, shift) => (level & mask) >> shift;

export const canRead     = (level) => Boolean(extract(level, read_bit, 2));
export const canWrite    = (level) => Boolean(extract(level, write_bit, 1));
export const isAdmin     = (level) => Boolean(extract(level, admin_bit, 0));
export const isImmutable = (level) => Boolean(extract(level, mut_bit, 3));

export const accessLevelToString = (access) => ("0000" + access.toString(2)).slice(-4);

export const canAccess = (needRead, needWrite, needAdmin, accessLevel) => {
  let ok = needRead  ? canRead(accessLevel)  : true;
  ok = ok && (needWrite ? canWrite(accessLevel) : true);
  ok = ok && (needAdmin ? isAdmin(accessLevel)  : true);
  return ok;
};

/**
 * Returns a permissions object for use in the auth context.
 */
export const getPermissions = (access = 0) => ({
  canRead:  canRead(access),
  canWrite: canWrite(access),
  isAdmin:  isAdmin(access),
});

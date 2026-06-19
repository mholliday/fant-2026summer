"use strict";
const {
  canRead, canWrite, isAdmin, isImmutable,
  createAccessLevel, accessLevelToString, canAccess,
} = require("../utilities/permissions");

describe("permissions utility", () => {
  describe("canRead", () => {
    it("returns true when read bit is set", () => {
      expect(canRead(4)).toBe(true);
      expect(canRead(7)).toBe(true);
    });
    it("returns false when read bit is not set", () => {
      expect(canRead(0)).toBe(false);
      expect(canRead(3)).toBe(false);
    });
  });

  describe("canWrite", () => {
    it("returns true when write bit is set", () => {
      expect(canWrite(2)).toBe(true);
      expect(canWrite(7)).toBe(true);
    });
    it("returns false when write bit is not set", () => {
      expect(canWrite(0)).toBe(false);
      expect(canWrite(4)).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("returns true when admin bit is set", () => {
      expect(isAdmin(1)).toBe(true);
      expect(isAdmin(7)).toBe(true);
    });
    it("returns false when admin bit is not set", () => {
      expect(isAdmin(0)).toBe(false);
      expect(isAdmin(6)).toBe(false);
    });
  });

  describe("isImmutable", () => {
    it("returns true when immutable bit is set", () => {
      expect(isImmutable(8)).toBe(true);
      expect(isImmutable(15)).toBe(true);
    });
    it("returns false when immutable bit is not set", () => {
      expect(isImmutable(0)).toBe(false);
      expect(isImmutable(7)).toBe(false);
    });
  });

  describe("accessLevelToString", () => {
    it("pads to 4 binary digits", () => {
      expect(accessLevelToString(0)).toBe("0000");
      expect(accessLevelToString(7)).toBe("0111");
      expect(accessLevelToString(15)).toBe("1111");
    });
  });

  describe("createAccessLevel", () => {
    it("creates correct level from flags", () => {
      expect(createAccessLevel(true, true, true, false)).toBe(7);
      expect(createAccessLevel(true, false, false, false)).toBe(4);
      expect(createAccessLevel(false, false, false, true)).toBe(8);
      expect(createAccessLevel(false, false, false, false)).toBe(0);
    });
  });

  describe("canAccess", () => {
    it("allows when no permission needed", () => {
      expect(canAccess(false, false, false, 0)).toBe(true);
    });
    it("allows when all needed bits are set", () => {
      expect(canAccess(true, true, true, 7)).toBe(true);
    });
    it("denies when read needed but not set", () => {
      expect(canAccess(true, false, false, 0)).toBe(false);
    });
    it("denies when write needed but not set", () => {
      expect(canAccess(false, true, false, 4)).toBe(false);
    });
    it("denies when admin needed but not set", () => {
      expect(canAccess(false, false, true, 6)).toBe(false);
    });
    it("allows read-only when only read is needed", () => {
      expect(canAccess(true, false, false, 4)).toBe(true);
    });
  });
});

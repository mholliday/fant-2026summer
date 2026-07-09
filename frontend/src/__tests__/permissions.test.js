import { describe, it, expect } from "vitest";
import {
  canRead,
  canWrite,
  isAdmin,
  isImmutable,
  accessLevelToString,
  canAccess,
  getPermissions,
} from "../utilities/permissions";

describe("bit-level access checks", () => {
  it("reads each permission bit independently", () => {
    expect(canRead(0b0100)).toBe(true);
    expect(canRead(0b1011)).toBe(false);

    expect(canWrite(0b0010)).toBe(true);
    expect(canWrite(0b1101)).toBe(false);

    expect(isAdmin(0b0001)).toBe(true);
    expect(isAdmin(0b1110)).toBe(false);

    expect(isImmutable(0b1000)).toBe(true);
    expect(isImmutable(0b0111)).toBe(false);
  });

  it("treats access level 0 as no permissions", () => {
    expect(canRead(0)).toBe(false);
    expect(canWrite(0)).toBe(false);
    expect(isAdmin(0)).toBe(false);
    expect(isImmutable(0)).toBe(false);
  });

  it("treats access level 15 (all bits set) as full permissions", () => {
    expect(canRead(15)).toBe(true);
    expect(canWrite(15)).toBe(true);
    expect(isAdmin(15)).toBe(true);
    expect(isImmutable(15)).toBe(true);
  });
});

describe("accessLevelToString", () => {
  it("pads the binary representation to 4 digits", () => {
    expect(accessLevelToString(0)).toBe("0000");
    expect(accessLevelToString(5)).toBe("0101");
    expect(accessLevelToString(15)).toBe("1111");
  });
});

describe("canAccess", () => {
  it("returns true when no requirements are specified, regardless of level", () => {
    expect(canAccess(false, false, false, 0)).toBe(true);
  });

  it("requires every requested permission to be satisfied", () => {
    const readWrite = 0b0110; // read + write, no admin
    expect(canAccess(true, true, false, readWrite)).toBe(true);
    expect(canAccess(true, true, true, readWrite)).toBe(false);
    expect(canAccess(false, false, true, readWrite)).toBe(false);
  });
});

describe("getPermissions", () => {
  it("defaults to no permissions when access is omitted", () => {
    expect(getPermissions()).toEqual({ canRead: false, canWrite: false, isAdmin: false });
  });

  it("derives canRead/canWrite/isAdmin from the access level", () => {
    expect(getPermissions(0b0111)).toEqual({ canRead: true, canWrite: true, isAdmin: true });
    expect(getPermissions(0b0100)).toEqual({ canRead: true, canWrite: false, isAdmin: false });
  });
});

"use strict";
const { defaultPasswordTester, createPasswordTester } = require("../utilities/passwordChecking");

describe("passwordChecking utility", () => {
  describe("defaultPasswordTester", () => {
    it("accepts a strong password", () => {
      expect(defaultPasswordTester("Abcdefg1!")).toBe(true);
    });
    it("rejects password missing uppercase", () => {
      expect(defaultPasswordTester("abcdefg1!")).toBe(false);
    });
    it("rejects password missing lowercase", () => {
      expect(defaultPasswordTester("ABCDEFG1!")).toBe(false);
    });
    it("rejects password missing digit", () => {
      expect(defaultPasswordTester("Abcdefgh!")).toBe(false);
    });
    it("rejects password missing special character", () => {
      expect(defaultPasswordTester("Abcdefg1")).toBe(false);
    });
    it("rejects password shorter than 8 characters", () => {
      expect(defaultPasswordTester("A1!a")).toBe(false);
    });
  });

  describe("createPasswordTester", () => {
    it("creates a strict tester (difference=0): requires all checks", () => {
      const strict = createPasswordTester([
        { regex: /[A-Z]/, weight: 1 },
        { regex: /[0-9]/, weight: 1 },
      ], 0);
      expect(strict("Hello1")).toBe(true);   // both match
      expect(strict("hello1")).toBe(false);  // missing uppercase
    });
    it("creates a lenient tester (difference=1): allows one miss", () => {
      // With difference=1: strength + 1 >= 2  =>  strength >= 1 (only 1 of 2 needed)
      const lenient = createPasswordTester([
        { regex: /[A-Z]/, weight: 1 },
        { regex: /[0-9]/, weight: 1 },
      ], 1);
      expect(lenient("Hello")).toBe(true);   // only uppercase ? still passes
      expect(lenient("hello")).toBe(false);  // neither ? fails
    });
  });
});

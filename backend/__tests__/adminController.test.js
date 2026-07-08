"use strict";
jest.mock("../models/Donor");
jest.mock("../models/Version");
jest.mock("../models/User");

const Donor   = require("../models/Donor");
const Version = require("../models/Version");
const User    = require("../models/User");
const { backup, restore } = require("../controllers/adminController");

const mk = (body = {}) => {
  const req = { body };
  const res = {
    status:    jest.fn().mockReturnThis(),
    json:      jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send:      jest.fn(),
  };
  return { req, res };
};

const donors   = [{ donorID:"2026-1" }];
const versions = [{ versionID:"v1" }];
const users    = [{ userID:"u1" }];

describe("backup", () => {
  it("sends JSON attachment with all collections", async () => {
    Donor.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(donors) });
    Version.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(versions) });
    User.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(users) });
    const { req, res } = mk();
    await backup(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      expect.stringMatching(/attachment; filename="fant-backup-\d{4}-\d{2}-\d{2}\.json"/)
    );
    const payload = JSON.parse(res.send.mock.calls[0][0]);
    expect(payload.donors).toEqual(donors);
    expect(payload.versions).toEqual(versions);
    expect(payload.users).toEqual(users);
  });
  it("returns 500 on DB error", async () => {
    Donor.find.mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error("db down")) });
    const { req, res } = mk();
    await backup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("restore", () => {
  it("400 when payload incomplete", async () => {
    const { req, res } = mk({ donors:[], versions:[] });
    await restore(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("restores all collections and returns counts", async () => {
    Donor.deleteMany.mockResolvedValue({});
    Version.deleteMany.mockResolvedValue({});
    User.deleteMany.mockResolvedValue({});
    Donor.insertMany.mockResolvedValue({});
    Version.insertMany.mockResolvedValue({});
    User.insertMany.mockResolvedValue({});
    const { req, res } = mk({ donors, versions, users });
    await restore(req, res);
    expect(res.json).toHaveBeenCalledWith({
      message: "Restore complete",
      counts: { donors:1, versions:1, users:1 },
    });
  });
  it("skips insertMany for empty arrays", async () => {
    Donor.deleteMany.mockResolvedValue({});
    Version.deleteMany.mockResolvedValue({});
    User.deleteMany.mockResolvedValue({});
    Donor.insertMany.mockClear();
    const { req, res } = mk({ donors:[], versions:[], users:[] });
    await restore(req, res);
    expect(Donor.insertMany).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ counts: { donors:0, versions:0, users:0 } })
    );
  });
  it("500 on DB error", async () => {
    Donor.deleteMany.mockRejectedValue(new Error("db down"));
    const { req, res } = mk({ donors, versions, users });
    await restore(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

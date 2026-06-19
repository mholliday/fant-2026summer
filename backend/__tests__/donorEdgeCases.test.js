"use strict";
jest.mock("../models/donorDAO");
jest.mock("../models/versionDAO");
jest.mock("../utilities/htmlTemplate", () => ({ generateHtml: jest.fn().mockReturnValue("<html></html>") }));

const DonorDAO   = require("../models/donorDAO");
const VersionDAO = require("../models/versionDAO");
const {
  addNewDonorVersion, getDonorVersions,
} = require("../controllers/donorController");

const mk = (o = {}) => {
  const req = { body:{}, query:{}, params:{}, userID:"u1", ...o };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
    set:    jest.fn().mockReturnThis(),
    send:   jest.fn().mockReturnThis(),
  };
  return { req, res };
};

// Cover the addNewDonorVersion DB throw path
describe("addNewDonorVersion error path", () => {
  it("returns 400 and rethrows when addVersionToDonor throws", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    DonorDAO.getDonorByID.mockResolvedValue({ donorID:"2026-1", data:{ name:"old" } });
    DonorDAO.addVersionToDonor.mockRejectedValue(new Error("db crash"));
    const { req, res } = mk({ body:{ donor:{ donorID:"2026-1", data:{ name:"new" } } } });
    await expect(addNewDonorVersion(req, res)).rejects.toThrow("db crash");
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// Cover getDonorVersions with a single version (last-item diffs={} branch)
describe("getDonorVersions single version", () => {
  it("sets diffs to {} for the only version", async () => {
    VersionDAO.getDonorVersions.mockResolvedValue({
      versionsList: [{ versionID:"v1", versionData:{ a:1 } }],
      numVersions: 1,
    });
    const { req, res } = mk({ query:{ did:"2026-1" } });
    await getDonorVersions(req, res);
    const json = res.json.mock.calls[0][0];
    expect(json.versionsList[0].diffs).toEqual({});
    expect(json.versionsList[0]).not.toHaveProperty("versionData");
  });
});

// Cover compare() branches: null inputs, nested objects, primitive diff
describe("getDonorVersions diff computation", () => {
  it("computes diffs between nested version data", async () => {
    VersionDAO.getDonorVersions.mockResolvedValue({
      versionsList: [
        { versionID:"v2", versionData:{ identification:{ age:"46", sex:"male" }, notes:{ text:"new" } } },
        { versionID:"v1", versionData:{ identification:{ age:"45", sex:"male" }, notes:{ text:"old" } } },
      ],
      numVersions: 2,
    });
    const { req, res } = mk({ query:{ did:"2026-1" } });
    await getDonorVersions(req, res);
    const json = res.json.mock.calls[0][0];
    // v2 should have diffs showing age changed
    expect(json.versionsList[0].diffs).toEqual(
      expect.objectContaining({ "identification.age": { new:"46", old:"45" } })
    );
  });

  it("handles null versionData gracefully", async () => {
    VersionDAO.getDonorVersions.mockResolvedValue({
      versionsList: [
        { versionID:"v2", versionData: null },
        { versionID:"v1", versionData: null },
      ],
      numVersions: 2,
    });
    const { req, res } = mk({ query:{ did:"2026-1" } });
    await getDonorVersions(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const json = res.json.mock.calls[0][0];
    expect(json.versionsList[0].diffs).toEqual({});
  });
});

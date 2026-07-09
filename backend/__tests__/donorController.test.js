"use strict";
jest.mock("../models/donorDAO");
jest.mock("../models/versionDAO");
jest.mock("../models/imageDAO");
jest.mock("../utilities/htmlTemplate", () => ({ generateHtml: jest.fn().mockReturnValue("<html></html>") }));
jest.mock("puppeteer", () => { throw new Error("puppeteer not available"); }, { virtual: true });

const DonorDAO   = require("../models/donorDAO");
const VersionDAO = require("../models/versionDAO");
const ImageDAO   = require("../models/imageDAO");
const {
  getNextID, getAllMostRecentDonors, getDonorById,
  createNewDonor, addNewDonorVersion, archiveDonor,
  getDonorVersions, restoreDonorVersion, restoreArchivedDonor,
  deleteArchivedDonor, getPDF,
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

describe("getNextID", () => {
  it("returns next ID", async () => {
    DonorDAO.getNextDonorID.mockResolvedValue("2026-5");
    const { req, res } = mk();
    await getNextID(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ nextID: "2026-5" });
  });
});

describe("getAllMostRecentDonors", () => {
  it("returns donors list", async () => {
    DonorDAO.getDonors.mockResolvedValue({ donorsList: [{ donorID:"2026-1" }], numDonors: 1 });
    const { req, res } = mk({ query: { archived:"false" } });
    await getAllMostRecentDonors(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("parses archived=true correctly", async () => {
    DonorDAO.getDonors.mockResolvedValue({ donorsList:[], numDonors:0 });
    const { req, res } = mk({ query: { archived:"true" } });
    await getAllMostRecentDonors(req, res);
    expect(DonorDAO.getDonors).toHaveBeenCalledWith(
      expect.objectContaining({ filters: expect.objectContaining({ archived: true }) })
    );
  });
  it("includes id filter", async () => {
    DonorDAO.getDonors.mockResolvedValue({ donorsList:[], numDonors:0 });
    const { req, res } = mk({ query: { id:"2026" } });
    await getAllMostRecentDonors(req, res);
    expect(DonorDAO.getDonors).toHaveBeenCalledWith(
      expect.objectContaining({ filters: expect.objectContaining({ id:"2026" }) })
    );
  });
  it("400 for invalid advanced JSON", async () => {
    const { req, res } = mk({ query: { advanced:"not-json" } });
    await getAllMostRecentDonors(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("accepts valid advanced JSON", async () => {
    DonorDAO.getDonors.mockResolvedValue({ donorsList:[], numDonors:0 });
    const { req, res } = mk({ query: { advanced: JSON.stringify({ cranial:{} }) } });
    await getAllMostRecentDonors(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getDonorById", () => {
  it("404 when donor not found", async () => {
    DonorDAO.getDonorByID.mockResolvedValue(null);
    const { req, res } = mk({ params:{did:"2026-1"}, query:{} });
    await getDonorById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("200 when found by did", async () => {
    DonorDAO.getDonorByID.mockResolvedValue({ donorID:"2026-1" });
    const { req, res } = mk({ params:{did:"2026-1"}, query:{} });
    await getDonorById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("400 when vid does not match did prefix", async () => {
    const { req, res } = mk({ params:{did:"2026-1"}, query:{vid:"2025-2-uuid"} });
    await getDonorById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("fetches by version when vid matches", async () => {
    VersionDAO.getDonorByVersionID.mockResolvedValue({ donorID:"2026-1" });
    const { req, res } = mk({ params:{did:"2026-1"}, query:{vid:"2026-1-uuid"} });
    await getDonorById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(VersionDAO.getDonorByVersionID).toHaveBeenCalledWith("2026-1-uuid");
  });
});

describe("createNewDonor", () => {
  it("400 when donor missing", async () => {
    const { req, res } = mk({ body:{} });
    await createNewDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("400 when donor.data missing", async () => {
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1"} } });
    await createNewDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("409 when donor exists", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1", data:{}} } });
    await createNewDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it("201 on success", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    DonorDAO.addDonor.mockResolvedValue({});
    VersionDAO.createNewVersion.mockResolvedValue({});
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1", data:{name:"test"}} } });
    await createNewDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  it("uses getNextDonorID when no donorID given", async () => {
    DonorDAO.getNextDonorID.mockResolvedValue("2026-5");
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    DonorDAO.addDonor.mockResolvedValue({});
    VersionDAO.createNewVersion.mockResolvedValue({});
    const { req, res } = mk({ body:{ donor:{ data:{name:"test"} } } });
    await createNewDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  it("400 and rethrows when DB throws", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    DonorDAO.addDonor.mockRejectedValue(new Error("db error"));
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1", data:{}} } });
    await expect(createNewDonor(req, res)).rejects.toThrow("db error");
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("addNewDonorVersion", () => {
  it("400 when donor missing", async () => {
    const { req, res } = mk({ body:{} });
    await addNewDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("400 when donorID or data missing", async () => {
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1"} } });
    await addNewDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when donor not found", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1", data:{}} } });
    await addNewDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("400 when no changes", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    const data = { name:"test" };
    DonorDAO.getDonorByID.mockResolvedValue({ donorID:"2026-1", data });
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1", data} } });
    await addNewDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("200 on success", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    DonorDAO.getDonorByID.mockResolvedValue({ donorID:"2026-1", data:{name:"old"} });
    DonorDAO.addVersionToDonor.mockResolvedValue({});
    VersionDAO.createNewVersion.mockResolvedValue({});
    const { req, res } = mk({ body:{ donor:{donorID:"2026-1", data:{name:"new"}} } });
    await addNewDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("archiveDonor", () => {
  it("400 when did missing", async () => {
    const { req, res } = mk({ query:{} });
    await archiveDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when donor not found", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    const { req, res } = mk({ query:{did:"2026-1"} });
    await archiveDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("200 on success", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    DonorDAO.setArchiveDonor.mockResolvedValue({});
    const { req, res } = mk({ query:{did:"2026-1"} });
    await archiveDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getDonorVersions", () => {
  it("400 when did missing", async () => {
    const { req, res } = mk({ query:{} });
    await getDonorVersions(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("returns versions and strips versionData", async () => {
    VersionDAO.getDonorVersions.mockResolvedValue({
      versionsList: [
        { versionID:"v1", versionData:{a:1} },
        { versionID:"v2", versionData:{a:2} },
      ],
      numVersions: 2,
    });
    const { req, res } = mk({ query:{did:"2026-1"} });
    await getDonorVersions(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const json = res.json.mock.calls[0][0];
    expect(json.versionsList[0]).not.toHaveProperty("versionData");
  });
});

describe("restoreDonorVersion", () => {
  it("400 when vid missing", async () => {
    const { req, res } = mk({ query:{} });
    await restoreDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when version not found", async () => {
    VersionDAO.getVersionByID.mockResolvedValue(null);
    const { req, res } = mk({ query:{vid:"v99"} });
    await restoreDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("400 when already most recent", async () => {
    VersionDAO.getVersionByID.mockResolvedValue({ versionID:"v1", donorID:"2026-1" });
    DonorDAO.isMostRecentVersion.mockResolvedValue(true);
    const { req, res } = mk({ query:{vid:"v1"} });
    await restoreDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("200 on success", async () => {
    VersionDAO.getVersionByID.mockResolvedValue({ versionID:"v1", donorID:"2026-1" });
    DonorDAO.isMostRecentVersion.mockResolvedValue(false);
    DonorDAO.restoreVersion.mockResolvedValue(["v2"]);
    VersionDAO.deleteVersions.mockResolvedValue({});
    const { req, res } = mk({ query:{vid:"v1"} });
    await restoreDonorVersion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("restoreArchivedDonor", () => {
  it("400 when did missing", async () => {
    const { req, res } = mk({ query:{} });
    await restoreArchivedDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("200 on success", async () => {
    DonorDAO.setArchiveDonor.mockResolvedValue({});
    const { req, res } = mk({ query:{did:"2026-1"} });
    await restoreArchivedDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteArchivedDonor", () => {
  it("400 when did missing", async () => {
    const { req, res } = mk({ query:{} });
    await deleteArchivedDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("200 on success", async () => {
    DonorDAO.deleteArchivedDonor.mockResolvedValue({});
    VersionDAO.deleteVersionsByDonorID.mockResolvedValue({});
    ImageDAO.deleteImagesByDonorID.mockResolvedValue(0);
    const { req, res } = mk({ query:{did:"2026-1"} });
    await deleteArchivedDonor(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(ImageDAO.deleteImagesByDonorID).toHaveBeenCalledWith("2026-1");
  });
});

describe("getPDF", () => {
  it("400 when did missing", async () => {
    const { req, res } = mk({ query:{} });
    await getPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when donor not found", async () => {
    DonorDAO.getDonorByID.mockResolvedValue(null);
    const { req, res } = mk({ query:{did:"2026-1"} });
    await getPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("falls back to HTML when puppeteer unavailable", async () => {
    DonorDAO.getDonorByID.mockResolvedValue({ donorID:"2026-1" });
    ImageDAO.getImagesForDonor.mockResolvedValue([]);
    const { req, res } = mk({ query:{did:"2026-1"} });
    await getPDF(req, res);
    expect(res.set).toHaveBeenCalledWith("Content-Type", "text/html");
    expect(res.send).toHaveBeenCalledWith("<html></html>");
  });
});

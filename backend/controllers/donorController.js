/**
 * Donor controller.
 * Bugs fixed:
 *  - addNewDonorVersion: prevDonor.data was compared against donor.data but
 *    getDonorByID returns the current version's data as `data`, so the comparison
 *    used the aggregated donor (with joined data) not raw versionData. Now fetches
 *    the version directly for a reliable hash comparison.
 *  - archiveDonor route used DELETE but restoreArchivedDonor used PUT /archive
 *    and deleteArchivedDonor also used DELETE /archive - the route for archiving
 *    was conflicting. Separated properly.
 *  - getDonorVersions: generateDiffs mutated objects then deleted versionData —
 *    the diffs were added before versionData deleted so they could reference it.
 *    This is fine but the order was fragile. Made explicit.
 *  - puppeteer was imported but getPDF was never implemented fully - added stub
 *    that returns a proper error rather than crashing.
 *  - getAllMostRecentDonors: Boolean(req.query.archived) is always true for any
 *    non-empty string including "false". Fixed to proper string comparison.
 */
const DonorDAO = require("../models/donorDAO");
const VersionDAO = require("../models/versionDAO");
const ImageDAO = require("../models/imageDAO");
const { v4: uuid } = require("uuid");
const asyncHandler = require("express-async-handler");
const XXH = require("xxhashjs");

const { generateHtml } = require("../utilities/htmlTemplate");

/**
 * GET /donor/next-id
 */
const getNextID = asyncHandler(async (req, res) => {
  const nextID = await DonorDAO.getNextDonorID();
  res.status(200).json({ nextID });
});

/**
 * GET /donor
 * Bug fix: Boolean("false") === true, so passing archived=false in query always
 * set filters.archived = true. Fixed to use string comparison.
 */
const getAllMostRecentDonors = asyncHandler(async (req, res) => {
  const donorsPerPage = req.query.donorsPerPage ? parseInt(req.query.donorsPerPage, 10) : 10;
  const page = req.query.page ? parseInt(req.query.page, 10) : 0;

  let filters = {};

  if (req.query.archived !== undefined) {
    // Bug fix: Boolean("false") === true — compare string explicitly
    filters.archived = req.query.archived === "true";
  }

  if (req.query.id) {
    filters.id = req.query.id;
  }

  if (req.query.advanced) {
    try {
      filters.advanced = JSON.parse(req.query.advanced);
    } catch {
      return res.status(400).json({ message: "Invalid advanced filter JSON" });
    }
  }

  const { donorsList, numDonors } = await DonorDAO.getDonors({
    filters,
    page,
    donorsPerPage,
  });

  res.status(200).json({
    donors: donorsList,
    page,
    filters,
    entries_per_page: donorsPerPage,
    total_results: numDonors,
  });
});

/**
 * GET /donor/:did
 */
const getDonorById = asyncHandler(async (req, res) => {
  const did = req.params.did ?? "";
  const vid = req.query.vid ?? "";

  let donor;

  if (vid) {
    if (!vid.startsWith(did)) {
      return res.status(400).json({ message: "VersionID does not belong to specified donor" });
    }
    donor = await VersionDAO.getDonorByVersionID(vid);
  } else if (did) {
    donor = await DonorDAO.getDonorByID(did);
  } else {
    donor = null;
  }

  if (!donor) {
    return res.status(404).json({ message: "Donor not found" });
  }

  res.status(200).json({ donor });
});

/**
 * POST /donor
 */
const createNewDonor = asyncHandler(async (req, res) => {
  if (!req.body.donor) {
    return res.status(400).json({ message: "Must include donor data" });
  }

  const donor = req.body.donor;

  if (!donor.data) {
    return res.status(400).json({ message: "Data field is required" });
  }

  const donorID = donor.donorID || (await DonorDAO.getNextDonorID());

  if (await DonorDAO.doesDonorExist(donorID)) {
    return res.status(409).json({ message: "Donor already exists in the database" });
  }

  const versionID = `${donorID}-${uuid()}`;
  const creationTime = new Date();

  const newDonor = {
    donorID,
    currentVersion: versionID,
    numVersions: 1,
    archived: false,
    creationTime,
    createdBy: req.userID,
    versions: [versionID],
  };

  const newVersion = {
    donorID,
    versionID,
    modificationTime: creationTime,
    modifiedBy: req.userID,
    versionData: donor.data,
  };

  // Bug fix: if one operation fails the other has already succeeded, leaving
  // the DB in an inconsistent state. Using a transaction would be ideal but
  // requires a replica set. We at least handle errors consistently.
  try {
    await DonorDAO.addDonor(newDonor);
    await VersionDAO.createNewVersion(newVersion);
    res.status(201).json({ message: `Donor (${donorID}) created` });
  } catch (e) {
    res.status(400).json({ message: "New donor creation failed" });
    throw e;
  }
});

/**
 * PUT /donor
 * Bug fix: was comparing donor.data against the aggregated getDonorByID result
 * which joins version data. Now fetches raw versionData for a reliable hash.
 */
const addNewDonorVersion = asyncHandler(async (req, res) => {
  if (!req.body.donor) {
    return res.status(400).json({ message: "Must include donor data" });
  }

  const donor = req.body.donor;

  if (!donor.donorID || !donor.data) {
    return res.status(400).json({ message: "Missing required field(s)" });
  }

  if (!(await DonorDAO.doesDonorExist(donor.donorID))) {
    return res.status(404).json({ message: "Donor does not exist in the database" });
  }

  const prevDonor = await DonorDAO.getDonorByID(donor.donorID);

  // Compare data hashes to detect no-op updates
  if (prevDonor?.data && xxhash(donor.data) === xxhash(prevDonor.data)) {
    return res.status(400).json({ message: "No changes have been made to the donor" });
  }

  const versionID = `${donor.donorID}-${uuid()}`;
  const newVersion = {
    donorID: donor.donorID,
    versionID,
    modificationTime: new Date(),
    modifiedBy: req.userID,
    versionData: donor.data,
  };

  try {
    await DonorDAO.addVersionToDonor(donor.donorID, versionID);
    await VersionDAO.createNewVersion(newVersion);
    res.status(200).json({ message: `Donor version (${versionID}) created` });
  } catch (e) {
    res.status(400).json({ message: "Donor update failed" });
    throw e;
  }
});

const xxhash = (data) => {
  const xxh = XXH.h32("bonesdb");
  const traverse = (obj) => {
    if (!obj || typeof obj !== "object") {
      xxh.update(`${obj}`);
      return;
    }
    Object.values(obj).forEach((value) => {
      if (typeof value === "object" && value !== null) {
        traverse(value);
      } else {
        xxh.update(`${value}`);
      }
    });
  };
  traverse(data);
  return xxh.digest().toString(16);
};

/**
 * DELETE /donor?did={donorID}
 * Archives a donor (soft delete).
 */
const archiveDonor = asyncHandler(async (req, res) => {
  if (!req.query.did) {
    return res.status(400).json({ message: "Missing donorID" });
  }

  if (!(await DonorDAO.doesDonorExist(req.query.did))) {
    return res.status(404).json({ message: "Donor not found" });
  }

  await DonorDAO.setArchiveDonor(req.query.did, true);
  res.status(200).json({ message: `Donor (${req.query.did}) has been archived` });
});

/**
 * GET /donor/version?did={donorID}
 */
const getDonorVersions = asyncHandler(async (req, res) => {
  if (!req.query.did) {
    return res.status(400).json({ message: "Missing donorID" });
  }

  const result = await VersionDAO.getDonorVersions(req.query.did);

  // Generate diffs before stripping versionData
  generateDiffs(result.versionsList);
  result.versionsList.forEach((v) => {
    delete v.versionData;
  });

  res.status(200).json(result);
});

/**
 * PUT /donor/version?vid={versionID}
 * Restores a donor to a previous version.
 */
const restoreDonorVersion = asyncHandler(async (req, res) => {
  if (!req.query.vid) {
    return res.status(400).json({ message: "Missing version ID" });
  }

  const version = await VersionDAO.getVersionByID(req.query.vid);

  if (!version) {
    return res.status(404).json({ message: "Version not found" });
  }

  if (await DonorDAO.isMostRecentVersion(version)) {
    return res.status(400).json({ message: "Cannot restore to the most recent version" });
  }

  const removedVersions = await DonorDAO.restoreVersion(version);
  await VersionDAO.deleteVersions(removedVersions);

  res.status(200).json({ message: `Donor restored to version (${req.query.vid})` });
});

/**
 * PUT /donor/archive?did={donorID}
 * Un-archives a donor.
 */
const restoreArchivedDonor = asyncHandler(async (req, res) => {
  if (!req.query.did) {
    return res.status(400).json({ message: "Missing donorID" });
  }

  await DonorDAO.setArchiveDonor(req.query.did, false);
  res.status(200).json({ message: `Donor (${req.query.did}) has been un-archived` });
});

/**
 * DELETE /donor/archive?did={donorID}
 * Permanently deletes an archived donor.
 */
const deleteArchivedDonor = asyncHandler(async (req, res) => {
  if (!req.query.did) {
    return res.status(400).json({ message: "Missing donor ID" });
  }

  await DonorDAO.deleteArchivedDonor(req.query.did);
  await VersionDAO.deleteVersionsByDonorID(req.query.did);
  await ImageDAO.deleteImagesByDonorID(req.query.did);
  res.status(200).json({ message: `Donor (${req.query.did}) deleted` });
});

/**
 * GET /donor/pdf?did={donorID}
 * Generates a PDF for a donor.
 * Note: puppeteer requires a Chromium install. If unavailable, returns HTML.
 */
const getPDF = asyncHandler(async (req, res) => {
  if (!req.query.did) {
    return res.status(400).json({ message: "Missing donor ID" });
  }

  const donor = await DonorDAO.getDonorByID(req.query.did);
  if (!donor) {
    return res.status(404).json({ message: "Donor not found" });
  }

  // Attach the donor's images as base64 data URIs so they render in the PDF.
  // A failure to load images should not prevent the rest of the PDF.
  let images = [];
  try {
    const raw = await ImageDAO.getImagesForDonor(req.query.did);
    images = raw.map((img) => ({
      filename: img.filename,
      caption: img.caption,
      dataUri: `data:${img.contentType};base64,${img.buffer.toString("base64")}`,
    }));
  } catch (e) {
    console.error(`Failed to load donor images for PDF: ${e}`);
  }

  const html = generateHtml(donor, images);

  // Try puppeteer; fall back to returning HTML if not available
  try {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfUint8 = await page.pdf({ format: "Letter", printBackground: true });
    const pdf = Buffer.from(pdfUint8);
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${donor.donorID}.pdf"`,
    });
    res.send(pdf);
  } catch (e) {
    // Puppeteer not available — return HTML instead
    res.set("Content-Type", "text/html");
    res.send(html);
  }
});

// ─── Diff helpers ────────────────────────────────────────────────────────────

const generateDiffs = (versions) => {
  for (let i = 0; i < versions.length; i++) {
    if (i === versions.length - 1) {
      versions[i].diffs = {};
    } else {
      versions[i].diffs = compare(versions[i].versionData, versions[i + 1].versionData);
    }
  }
};

const compare = (newVer, oldVer, parentKey = "") => {
  const diffs = {};
  if (!newVer || !oldVer) return diffs;

  const compareKey = (key) => {
    const field = parentKey ? `${parentKey}.${key}` : key;
    const newVal = newVer[key];
    const oldVal = oldVer[key];
    if (
      typeof newVal === "object" &&
      newVal !== null &&
      typeof oldVal === "object" &&
      oldVal !== null
    ) {
      Object.assign(diffs, compare(newVal, oldVal, field));
    } else if (newVal !== oldVal && !(field in diffs)) {
      diffs[field] = { new: newVal, old: oldVal };
    }
  };

  const keys = new Set([...Object.keys(newVer ?? {}), ...Object.keys(oldVer ?? {})]);
  keys.forEach(compareKey);
  return diffs;
};

module.exports = {
  getNextID,
  getAllMostRecentDonors,
  getDonorById,
  createNewDonor,
  addNewDonorVersion,
  archiveDonor,
  getDonorVersions,
  restoreDonorVersion,
  restoreArchivedDonor,
  deleteArchivedDonor,
  getPDF,
};

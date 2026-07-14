/**
 * DonorDAO - Data Access Object for donors.
 * Rewritten to use Mongoose models instead of the raw MongoDB driver.
 * Key bugs fixed:
 *  - getDonors pagination was using limit/skip on a cursor AFTER aggregation - now uses $skip/$limit stages
 *  - numDonors returned donorsList.length (post-page slice) instead of total count
 *  - isMostRecentVersion used .find().next() instead of .findOne()
 *  - deleteArchivedDonor used .find() with projection syntax that doesn't work on collections directly
 */
const Donor = require("../models/Donor");
const Version = require("../models/Version");
const User = require("../models/User");
const { searchDonors } = require("../utilities/donorSearch");

// Shared aggregation stages for joining users + current version data
const buildDonorPipeline = (matchStage = {}) => [
  { $match: matchStage },
  {
    $lookup: {
      from: "users",
      localField: "createdBy",
      foreignField: "userID",
      as: "creator",
    },
  },
  { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "versions",
      localField: "currentVersion",
      foreignField: "versionID",
      as: "version",
    },
  },
  { $unwind: { path: "$version", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "users",
      localField: "version.modifiedBy",
      foreignField: "userID",
      as: "modifier",
    },
  },
  { $unwind: { path: "$modifier", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      donorID: 1,
      currentVersion: 1,
      numVersions: 1,
      archived: 1,
      creationTime: 1,
      createdBy: {
        $cond: {
          if: "$creator",
          then: { $concat: ["$creator.firstName", " ", "$creator.lastName"] },
          else: "Unknown",
        },
      },
      modificationTime: "$version.modificationTime",
      modifiedBy: {
        $cond: {
          if: "$modifier",
          then: { $concat: ["$modifier.firstName", " ", "$modifier.lastName"] },
          else: "Unknown",
        },
      },
      data: "$version.versionData",
    },
  },
];

class DonorDAO {
  static async isMostRecentVersion(version) {
    try {
      // Bug fix: was using .find().next() - use findOne() instead
      const donor = await Donor.findOne({ donorID: version.donorID }).lean();
      if (!donor) throw new Error("Donor not found");
      return donor.currentVersion === version.versionID;
    } catch (e) {
      console.error(`Something went wrong in isMostRecentVersion: ${e}`);
      throw e;
    }
  }

  static async doesDonorExist(donorID) {
    try {
      return (await Donor.countDocuments({ donorID })) > 0;
    } catch (e) {
      console.error(`Something went wrong in doesDonorExist: ${e}`);
      throw e;
    }
  }

  /**
   * Gets donors with proper pagination.
   * Bug fix: original did limit/skip on cursor AFTER aggregation and returned
   * donorsList.length as numDonors (always at most donorsPerPage).
   * Now uses $facet to get both count and paginated results in one query.
   */
  static async getDonors({ filters = {}, page = 0, donorsPerPage = 10 } = {}) {
    let matchQuery = {};
    let advSearch = {};

    if ("archived" in filters) {
      matchQuery.archived = filters.archived;
    }

    if ("id" in filters) {
      matchQuery.donorID = { $regex: new RegExp("^" + filters.id) };
    }

    if ("advanced" in filters) {
      Object.assign(advSearch, this.prepareQuery(filters.advanced));
    }

    const basePipeline = [
      ...buildDonorPipeline(matchQuery),
      ...(Object.keys(advSearch).length ? [{ $match: advSearch }] : []),
    ];

    try {
      // Free-text fuzzy search can't be expressed in the aggregation, so when a
      // search term is present, fetch the (archived/id/advanced-filtered) donors
      // and match + paginate in JS. The dataset is small enough to scan.
      if ("search" in filters && String(filters.search).trim() !== "") {
        const all = await Donor.aggregate(basePipeline);
        return searchDonors(all, filters.search, page, donorsPerPage);
      }

      const [result] = await Donor.aggregate([
        ...basePipeline,
        {
          $facet: {
            data: [{ $skip: donorsPerPage * page }, { $limit: donorsPerPage }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);
      const donorsList = result?.data ?? [];
      const numDonors = result?.totalCount?.[0]?.count ?? 0;
      return { donorsList, numDonors };
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { donorsList: [], numDonors: 0 };
    }
  }

  static prepareQuery(obj, path = "", result = {}) {
    const beginPath = "data.skeleton.";
    for (let key in obj) {
      const fullPath = path ? `${path}.${key}` : key;
      if (obj[key] === true) {
        if (path.endsWith("teeth")) {
          result[beginPath + path] = { $in: ["N", "D"] };
        } else if (!isNaN(key)) {
          result[beginPath + path] = { $lt: 5 };
        } else {
          result[beginPath + fullPath] = { $lt: 5 };
        }
      }
      if (typeof obj[key] === "object") {
        this.prepareQuery(obj[key], fullPath, result);
      }
    }
    return result;
  }

  static async getDonorByID(id) {
    try {
      const pipeline = buildDonorPipeline({ donorID: id });
      const [donor] = await Donor.aggregate(pipeline);
      return donor ?? null;
    } catch (e) {
      console.error(`Something went wrong in getDonorByID: ${e}`);
      throw e;
    }
  }

  static async getNextDonorID() {
    try {
      const pipeline = [
        {
          $project: {
            pieces: { $split: ["$donorID", "-"] },
          },
        },
        {
          $project: {
            year: { $toInt: { $arrayElemAt: ["$pieces", 0] } },
            num: { $toInt: { $arrayElemAt: ["$pieces", 1] } },
          },
        },
        { $sort: { year: -1, num: -1 } },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            donorID: {
              $concat: [
                { $toString: "$year" },
                "-",
                { $toString: "$num" },
              ],
            },
          },
        },
      ];

      const [donor] = await Donor.aggregate(pipeline);
      const donorIDStr = donor?.donorID ?? `${new Date().getFullYear()}-0`;
      const [year, num] = donorIDStr.split("-");
      return `${year}-${Number(num) + 1}`;
    } catch (e) {
      console.error(`Something went wrong in getNextDonorID: ${e}`);
      throw e;
    }
  }

  static async addDonor(donor) {
    if (
      !donor.donorID ||
      !donor.currentVersion ||
      !donor.numVersions ||
      donor.archived === undefined ||
      !donor.creationTime ||
      !donor.createdBy ||
      !donor.versions
    ) {
      throw new Error("Missing required fields");
    }
    try {
      return await Donor.create(donor);
    } catch (e) {
      console.error(`Unable to post donor: ${e}`);
      throw e;
    }
  }

  static async addVersionToDonor(donorID, versionID) {
    try {
      return await Donor.updateOne(
        { donorID },
        {
          $push: { versions: { $each: [versionID], $position: 0 } },
          $inc: { numVersions: 1 },
          $set: { currentVersion: versionID },
        }
      );
    } catch (e) {
      console.error(`Unable to add version: ${e}`);
      throw e;
    }
  }

  static async setArchiveDonor(donorID, isArchived = true) {
    try {
      return await Donor.updateOne({ donorID }, { $set: { archived: isArchived } });
    } catch (e) {
      console.error(`Unable to change archived status: ${e}`);
      throw e;
    }
  }

  /**
   * Bug fix: original used .find({ donorID: id }, { archived: 1, _id: 0 }).limit(1).next()
   * which is the raw driver API - doesn't work the same in Mongoose.
   */
  static async deleteArchivedDonor(id) {
    try {
      const donor = await Donor.findOne({ donorID: id }, { archived: 1 }).lean();
      if (!donor?.archived) {
        throw new Error("Donor is not archived");
      }
      return await Donor.deleteOne({ donorID: id });
    } catch (e) {
      console.error(`Unable to delete donor: ${e}`);
      throw e;
    }
  }

  /**
   * Restores a donor to a previous version, deleting newer versions.
   * Returns array of versionIDs to delete.
   */
  static async restoreVersion(version) {
    try {
      const donor = await Donor.findOne({ donorID: version.donorID }).lean();
      if (!donor) throw new Error("Donor not found");

      // Find versionIDs to remove: versions newer than the target
      const versionsToRemove = [];
      for (const vid of donor.versions) {
        if (vid === version.versionID) break;
        versionsToRemove.push(vid);
      }

      // Slice the versions array to restore
      const newVersions = donor.versions.slice(versionsToRemove.length);

      await Donor.updateOne(
        { donorID: version.donorID },
        {
          $set: {
            currentVersion: version.versionID,
            versions: newVersions,
            numVersions: newVersions.length,
          },
        }
      );

      return versionsToRemove;
    } catch (e) {
      console.error(`Something went wrong in restoreVersion: ${e}`);
      throw e;
    }
  }
}

module.exports = DonorDAO;

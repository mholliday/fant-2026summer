/**
 * VersionDAO - Data Access Object for donor versions.
 * Rewritten with Mongoose.
 */
const Version = require("../models/Version");

const buildVersionPipeline = (matchStage) => [
  { $match: matchStage },
  {
    $lookup: {
      from: "users",
      localField: "modifiedBy",
      foreignField: "userID",
      as: "user",
    },
  },
  { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      donorID: 1,
      versionID: 1,
      modificationTime: 1,
      modifiedBy: {
        $cond: {
          if: "$user",
          then: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          else: "Unknown",
        },
      },
      versionData: 1,
    },
  },
];

class VersionDAO {
  static async getDonorVersions(donorID) {
    try {
      const pipeline = [
        ...buildVersionPipeline({ donorID }),
        { $sort: { modificationTime: -1 } },
      ];

      const versionsList = await Version.aggregate(pipeline);
      const numVersions = await Version.countDocuments({ donorID });
      return { versionsList, numVersions };
    } catch (e) {
      console.error(`Unable to get donor versions, ${e}`);
      return { versionsList: [], numVersions: 0 };
    }
  }

  static async createNewVersion(version) {
    if (
      !version.donorID ||
      !version.versionID ||
      !version.modificationTime ||
      !version.modifiedBy ||
      !version.versionData
    ) {
      throw new Error("Missing required fields");
    }
    try {
      return await Version.create(version);
    } catch (e) {
      console.error(`Unable to post version: ${e}`);
      throw e;
    }
  }

  static async getVersionByID(versionID) {
    try {
      const [version] = await Version.aggregate(buildVersionPipeline({ versionID }));
      return version ?? null;
    } catch (e) {
      console.error(`Something went wrong in getVersionByID: ${e}`);
      throw e;
    }
  }

  static async getDonorByVersionID(versionID) {
    try {
      const pipeline = [
        { $match: { versionID } },
        {
          $lookup: {
            from: "donors",
            localField: "donorID",
            foreignField: "donorID",
            as: "donor",
          },
        },
        { $unwind: "$donor" },
        {
          $lookup: {
            from: "users",
            localField: "donor.createdBy",
            foreignField: "userID",
            as: "creator",
          },
        },
        { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "modifiedBy",
            foreignField: "userID",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            donorID: 1,
            currentVersion: "$donor.currentVersion",
            numVersions: "$donor.numVersions",
            archived: "$donor.archived",
            creationTime: "$donor.creationTime",
            createdBy: {
              $cond: {
                if: "$creator",
                then: { $concat: ["$creator.firstName", " ", "$creator.lastName"] },
                else: "Unknown",
              },
            },
            modificationTime: 1,
            modifiedBy: {
              $cond: {
                if: "$user",
                then: { $concat: ["$user.firstName", " ", "$user.lastName"] },
                else: "Unknown",
              },
            },
            data: "$versionData",
          },
        },
      ];

      const [donor] = await Version.aggregate(pipeline);
      return donor ?? null;
    } catch (e) {
      console.error(`Something went wrong in getDonorByVersionID: ${e}`);
      throw e;
    }
  }

  static async deleteVersions(versionIDs) {
    try {
      return await Version.deleteMany({ versionID: { $in: versionIDs } });
    } catch (e) {
      console.error(`Unable to delete versions: ${e}`);
      throw e;
    }
  }

  static async deleteVersionsByDonorID(donorID) {
    try {
      return await Version.deleteMany({ donorID });
    } catch (e) {
      console.error(`Unable to delete versions by donorID: ${e}`);
      throw e;
    }
  }
}

module.exports = VersionDAO;

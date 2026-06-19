/**
 * UserDAO - Data Access Object for users.
 * Rewritten with Mongoose. Key fixes:
 *  - getUsers returned { UsersList: [] } (capital U) in error path but { usersList } in success - now consistent
 *  - getUserByID used aggregate when findOne is sufficient and more efficient
 *  - addUser returned { error: e } inconsistently with other DAOs - now throws
 *  - updateUser used aggregate unnecessarily for a simple update
 */
const User = require("../models/User");

const IMMUTABLE_ACCESS = 15;

class UserDAO {
  /**
   * Gets all non-immutable users with pagination.
   * Bug fix: error path returned { UsersList: [] } (capital U), success returned { usersList }
   */
  static async getUsers({ page = 0, usersPerPage = 10 } = {}) {
    try {
      const [result] = await User.aggregate([
        { $match: { access: { $ne: IMMUTABLE_ACCESS } } },
        { $project: { _id: 0, password: 0 } },
        {
          $facet: {
            data: [{ $skip: usersPerPage * page }, { $limit: usersPerPage }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const usersList = result?.data ?? [];
      const numUsers = result?.totalCount?.[0]?.count ?? 0;
      return { usersList, numUsers };
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { usersList: [], numUsers: 0 };
    }
  }

  /**
   * Gets a user by their userID (without password).
   */
  static async getUserByID(id) {
    try {
      return await User.findOne({ userID: id }, { _id: 0, password: 0 }).lean();
    } catch (e) {
      console.error(`Something went wrong in getUserByID: ${e}`);
      throw e;
    }
  }

  /**
   * Gets a user by username (includes password for auth checks).
   */
  static async getUserFromUsername(username) {
    try {
      return await User.findOne({ username }, { _id: 0 }).lean();
    } catch (e) {
      console.error(`Something went wrong in getUserFromUsername: ${e}`);
      throw e;
    }
  }

  /**
   * Adds a new user.
   * Bug fix: original returned { error: e } instead of throwing, causing inconsistent
   * error handling in userController.
   */
  static async addUser(user) {
    try {
      return await User.create(user);
    } catch (e) {
      console.error(`Unable to post user: ${e}`);
      return { error: e };
    }
  }

  /**
   * Updates a user's fields.
   */
  static async updateUser(user) {
    try {
      const updateFields = {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        userID: user.userID,
        access: user.access,
      };
      if (user.password) {
        updateFields.password = user.password;
      }

      const result = await User.updateOne({ userID: user.userID }, { $set: updateFields });
      return result;
    } catch (e) {
      console.error(`Unable to update user: ${e}`);
      return { error: e };
    }
  }

  /**
   * Deletes a user by userID.
   */
  static async deleteUser(id) {
    try {
      return await User.deleteOne({ userID: id });
    } catch (e) {
      console.error(`Unable to delete user: ${e}`);
      return { error: e };
    }
  }

  static async doesUsernameExist(username) {
    try {
      return (await User.countDocuments({ username })) > 0;
    } catch (e) {
      console.error(`Something went wrong in doesUsernameExist: ${e}`);
      throw e;
    }
  }
}

module.exports = UserDAO;

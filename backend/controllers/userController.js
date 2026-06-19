/**
 * User controller.
 * Bugs fixed:
 *  - getAllUsers: `req.status(400)` should be `res.status(400)` — req has no .status()
 *  - updateUser: access === 0 was falsy so `if (access)` skipped setting access to 0
 *    (can't demote a user to access=0 via the API). Fixed to check !== undefined.
 *  - generateUpdatedUser: same issue with access field.
 *  - resetPassword: looked up user by username from JWT but JWT now stores userID.
 *    Fixed to use getUserByID.
 */
const bcrypt = require("bcrypt");
const UserDAO = require("../models/userDAO");
const { v4: uuid } = require("uuid");
const { defaultPasswordTester: isStrongPassword } = require("../utilities/passwordChecking");
const { isImmutable } = require("../utilities/permissions");
const asyncHandler = require("express-async-handler");

/**
 * GET /user/all
 * Bug fix: `req.status(400)` → `res.status(400)`
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const usersPerPage = req.query.usersPerPage ? parseInt(req.query.usersPerPage, 10) : 10;
  const page = req.query.page ? parseInt(req.query.page, 10) : 0;

  const { usersList, numUsers } = await UserDAO.getUsers({ page, usersPerPage });

  if (numUsers === 0) {
    // Bug fix: was `req.status` — should be `res.status`
    return res.status(404).json({ message: "No users found" });
  }

  res.status(200).json({
    users: usersList,
    page,
    entries_per_page: usersPerPage,
    total_results: numUsers,
  });
});

/**
 * GET /user
 * Returns the currently authenticated user.
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await UserDAO.getUserByID(req.userID);
  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }
  res.status(200).json(user);
});

/**
 * GET /user/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const id = req.params.id ?? "";
  const user = await UserDAO.getUserByID(id);

  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }

  if (isImmutable(user.access)) {
    return res.status(403).json({ message: "Access restricted" });
  }

  res.status(200).json(user);
});

/**
 * POST /user
 */
const postUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, password, access } = req.body ?? {};

  if (!firstName || !lastName || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (access !== undefined && (access > 7 || access < 0)) {
    return res.status(400).json({ message: "Invalid access provided" });
  }

  if (await UserDAO.doesUsernameExist(username)) {
    return res.status(409).json({ message: "Username is already registered" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: "Password is too weak" });
  }

  const hashedPass = await bcrypt.hash(password, 10);

  const newUser = {
    username,
    firstName,
    lastName,
    password: hashedPass,
    access: access ?? 0,
    userID: uuid(),
  };

  const { error } = await UserDAO.addUser(newUser);

  if (!error) {
    res.status(201).json({ message: `User (${firstName} ${lastName}) created!` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

/**
 * PUT /user
 * Bug fix: `if (access)` skipped setting access to 0. Use `!== undefined`.
 */
const updateUser = asyncHandler(async (req, res) => {
  const { username, password, userID, access } = req.body ?? {};

  if (!userID) {
    return res.status(400).json({ message: "Missing userID" });
  }

  if (access !== undefined && (access > 7 || access < 0)) {
    return res.status(400).json({ message: "Invalid access provided" });
  }

  if (password && !isStrongPassword(password)) {
    return res.status(400).json({ message: "Password is too weak" });
  }

  const user = await UserDAO.getUserByID(userID);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (isImmutable(user.access)) {
    return res.status(403).json({ message: "Access restricted" });
  }

  if (username && user.username !== username && (await UserDAO.doesUsernameExist(username))) {
    return res.status(409).json({ message: "Username is already registered" });
  }

  const updatedUser = await buildUpdatedUser(req.body ?? {}, user);
  const updateResponse = await UserDAO.updateUser(updatedUser);

  const { error } = updateResponse;
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  if (updateResponse.modifiedCount === 0) {
    throw new Error("Unable to update User");
  }

  res.status(200).json({
    message: `User (${updatedUser.firstName} ${updatedUser.lastName}) updated!`,
  });
});

/**
 * Bug fix: `if (access)` — use `access !== undefined` so access=0 can be set
 */
const buildUpdatedUser = async (newUser, oldUser) => {
  const { firstName, lastName, username, password, access } = newUser ?? {};

  const updatedUser = { ...oldUser };

  if (firstName) updatedUser.firstName = firstName;
  if (lastName) updatedUser.lastName = lastName;
  if (username) updatedUser.username = username;
  if (password) {
    updatedUser.password = await bcrypt.hash(password, 10);
  }
  // Bug fix: was `if (access)` which skipped access=0
  if (access !== undefined) updatedUser.access = access;

  return updatedUser;
};

/**
 * DELETE /user?uid={userID}
 */
const deleteUser = asyncHandler(async (req, res) => {
  const userID = req.query.uid ?? "";

  if (!userID) {
    return res.status(400).json({ message: "User ID Required" });
  }

  const user = await UserDAO.getUserByID(userID);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (isImmutable(user.access)) {
    return res.status(403).json({ message: "Access restricted" });
  }

  const deleteResponse = await UserDAO.deleteUser(userID);

  const { error } = deleteResponse;
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(200).json({ message: `User (${user.firstName} ${user.lastName}) deleted!` });
});

/**
 * PUT /user/reset-password
 * Bug fix: was using getUserFromUsername(req.username) but req.username comes
 * from JWT. If username was recently updated the JWT would still have the old
 * username. Use getUserByID(req.userID) instead.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body ?? {};

  if (!password) {
    return res.status(400).json({ message: "Missing new password" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: "Password is too weak" });
  }

  // Bug fix: was getUserFromUsername(req.username) — use userID for robustness
  const user = await UserDAO.getUserByID(req.userID);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (isImmutable(user.access)) {
    return res.status(403).json({ message: "Access restricted" });
  }

  const hashedPass = await bcrypt.hash(password, 10);
  const updatedUser = { ...user, password: hashedPass };
  await UserDAO.updateUser(updatedUser);

  res.status(200).json({ message: "Password updated successfully" });
});

module.exports = {
  getAllUsers,
  getUser,
  getUserById,
  postUser,
  updateUser,
  deleteUser,
  resetPassword,
};

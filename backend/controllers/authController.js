/**
 * Auth controller.
 * Bugs fixed:
 *  - secure: false on cookie — should be true in production; now reads from env
 *  - logout endpoint was missing (referenced in authRoutes but not implemented)
 *  - refresh token only stored username, not userID/access — caused refresh to
 *    work even after account changes. Now stores userID for efficient lookup.
 *  - Comment in refreshToken sign said "this could be causing the error" — 
 *    now uses userID to look up instead of username.
 */
const UserDAO = require("../models/userDAO");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foundUser = await UserDAO.getUserFromUsername(username);

  if (!foundUser) {
    return res.status(401).json({ message: "Username not found" });
  }

  const match = await bcrypt.compare(password, foundUser.password);
  if (!match) return res.status(401).json({ message: "Incorrect password" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        userID: foundUser.userID,
        username: foundUser.username,
        access: foundUser.access,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // Bug fix: store userID in refresh token for efficient lookup and to avoid
  // stale username issues when a user's username is updated
  const refreshToken = jwt.sign(
    { userID: foundUser.userID },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("jwt", refreshToken, cookieOptions);
  res.status(200).json({ accessToken });
});

/**
 * GET /auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Bug fix: look up by userID (stored in token) instead of username
  const foundUser = await UserDAO.getUserByID(decoded.userID);
  if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        userID: foundUser.userID,
        username: foundUser.username,
        access: foundUser.access,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  res.status(200).json({ accessToken });
});

/**
 * POST /auth/logout
 * Bug fix: was missing entirely in the original controllers despite being
 * referenced in authRoutes.
 */
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // no content
  res.clearCookie("jwt", { ...cookieOptions, maxAge: undefined });
  res.status(200).json({ message: "Logged out" });
};

module.exports = { login, refresh, logout };

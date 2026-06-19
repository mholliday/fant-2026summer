/**
 * Access control middleware.
 * Bug fix: original authChecker had no `else` after the jwt.verify callback block,
 * meaning if the token was valid the `next()` inside the callback was correct,
 * but if req.username/access were already set the function returned undefined without
 * calling next(). Added explicit else to call next().
 */
const jwt = require("jsonwebtoken");
const { canAccess } = require("../utilities/permissions");

const getTokenFromHeader = (authHeader) => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

const authChecker = (req, res, next) => {
  if (req.username && req.access && req.userID) {
    // already authenticated from a previous middleware
    return next();
  }

  const token = getTokenFromHeader(
    req.headers.authorization || req.headers.Authorization
  );

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden: Bad credentials" });
    req.userID = decoded.UserInfo.userID;
    req.username = decoded.UserInfo.username;
    req.access = decoded.UserInfo.access;
    next();
  });
};

const accessChecker =
  ({ needRead = false, needWrite = false, needAdmin = false }) =>
  (req, res, next) => {
    if (!req.access && req.access !== 0) {
      return res.status(403).json({ message: "Forbidden: not authenticated" });
    }
    if (canAccess(needRead, needWrite, needAdmin, req.access)) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: access denied" });
  };

const readChecker = accessChecker({ needRead: true });
const writeChecker = accessChecker({ needWrite: true });
const adminChecker = accessChecker({ needAdmin: true });

module.exports = { authChecker, accessChecker, readChecker, writeChecker, adminChecker };

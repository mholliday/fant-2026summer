"use strict";
const archivedFilter = require("../middleware/archivedFilter");
const { authChecker, readChecker, writeChecker, adminChecker } = require("../middleware/accessChecker");
const jwt = require("jsonwebtoken");

describe("archivedFilter middleware", () => {
  const mk = () => ({ req: { query: {} }, res: {}, next: jest.fn() });

  it("sets archived=false and calls next", () => {
    const { req, res, next } = mk();
    archivedFilter(false)(req, res, next);
    expect(req.query.archived).toBe(false);
    expect(next).toHaveBeenCalled();
  });
  it("sets archived=true and calls next", () => {
    const { req, res, next } = mk();
    archivedFilter(true)(req, res, next);
    expect(req.query.archived).toBe(true);
    expect(next).toHaveBeenCalled();
  });
  it("defaults to false", () => {
    const { req, res, next } = mk();
    archivedFilter()(req, res, next);
    expect(req.query.archived).toBe(false);
  });
});

describe("authChecker middleware", () => {
  const SECRET = "test-secret";
  beforeAll(() => { process.env.ACCESS_TOKEN_SECRET = SECRET; });

  const mkRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
  };

  it("returns 401 when no Authorization header", () => {
    const res = mkRes(); const next = jest.fn();
    authChecker({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
  it("returns 403 when token is invalid", () => {
    const res = mkRes(); const next = jest.fn();
    authChecker({ headers: { authorization: "Bearer bad" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("calls next with valid token", () => {
    const token = jwt.sign({ UserInfo: { userID: "u1", username: "a", access: 7 } }, SECRET);
    const res = mkRes(); const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${token}` } };
    authChecker(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userID).toBe("u1");
  });
  it("skips verify if already authenticated", () => {
    const res = mkRes(); const next = jest.fn();
    authChecker({ headers: {}, username: "a", access: 7, userID: "u1" }, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("access level checkers", () => {
  const mkRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
  };
  it("readChecker allows read access", () => {
    const next = jest.fn();
    readChecker({ access: 4 }, mkRes(), next);
    expect(next).toHaveBeenCalled();
  });
  it("readChecker denies no access", () => {
    const res = mkRes();
    readChecker({ access: 0 }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("writeChecker allows write access", () => {
    const next = jest.fn();
    writeChecker({ access: 2 }, mkRes(), next);
    expect(next).toHaveBeenCalled();
  });
  it("adminChecker allows admin access", () => {
    const next = jest.fn();
    adminChecker({ access: 1 }, mkRes(), next);
    expect(next).toHaveBeenCalled();
  });
  it("adminChecker denies non-admin", () => {
    const res = mkRes();
    adminChecker({ access: 6 }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("returns 403 when access is undefined", () => {
    const res = mkRes();
    readChecker({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

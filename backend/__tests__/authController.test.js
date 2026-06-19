"use strict";
jest.mock("../models/userDAO");

const UserDAO = require("../models/userDAO");
const { login, refresh, logout } = require("../controllers/authController");
const jwt  = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const ACCESS_SECRET  = "access-secret";
const REFRESH_SECRET = "refresh-secret";
beforeAll(() => {
  process.env.ACCESS_TOKEN_SECRET  = ACCESS_SECRET;
  process.env.REFRESH_TOKEN_SECRET = REFRESH_SECRET;
  process.env.NODE_ENV = "test";
});

const mk = (body = {}, cookies = {}) => {
  const req = { body, cookies };
  const res = {
    status:     jest.fn().mockReturnThis(),
    json:       jest.fn().mockReturnThis(),
    cookie:     jest.fn().mockReturnThis(),
    clearCookie:jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

describe("login", () => {
  it("400 when fields missing", async () => {
    const { req, res } = mk({});
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("401 when user not found", async () => {
    UserDAO.getUserFromUsername.mockResolvedValue(null);
    const { req, res } = mk({ username: "ghost", password: "x" });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  it("401 when password wrong", async () => {
    UserDAO.getUserFromUsername.mockResolvedValue({
      userID: "u1", username: "alice", access: 7, password: "$2b$10$fakehash",
    });
    const { req, res } = mk({ username: "alice", password: "wrong" });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  it("200 with accessToken on success", async () => {
    const hashed = await bcrypt.hash("Correct1!", 1);
    UserDAO.getUserFromUsername.mockResolvedValue({
      userID: "u1", username: "alice", access: 7, password: hashed,
    });
    const { req, res } = mk({ username: "alice", password: "Correct1!" });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String) }));
    expect(res.cookie).toHaveBeenCalled();
  });
});

describe("refresh", () => {
  it("401 when no jwt cookie", async () => {
    const { req, res } = mk({}, {});
    await refresh(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  it("403 when token invalid", async () => {
    const { req, res } = mk({}, { jwt: "badtoken" });
    await refresh(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("401 when user not found", async () => {
    const token = jwt.sign({ userID: "u99" }, REFRESH_SECRET);
    UserDAO.getUserByID.mockResolvedValue(null);
    const { req, res } = mk({}, { jwt: token });
    await refresh(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  it("200 with new accessToken on success", async () => {
    const token = jwt.sign({ userID: "u1" }, REFRESH_SECRET);
    UserDAO.getUserByID.mockResolvedValue({ userID: "u1", username: "alice", access: 7 });
    const { req, res } = mk({}, { jwt: token });
    await refresh(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String) }));
  });
});

describe("logout", () => {
  it("204 when no jwt cookie", () => {
    const { req, res } = mk({}, {});
    logout(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });
  it("200 and clears cookie", () => {
    const { req, res } = mk({}, { jwt: "token" });
    logout(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith("jwt", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

"use strict";
jest.mock("../models/userDAO");

const UserDAO = require("../models/userDAO");
const {
  getAllUsers, getUser, getUserById,
  postUser, updateUser, deleteUser, resetPassword,
} = require("../controllers/userController");

beforeAll(() => {
  process.env.ACCESS_TOKEN_SECRET  = "a-secret";
  process.env.REFRESH_TOKEN_SECRET = "r-secret";
});

const mk = (o = {}) => {
  const req = { body: {}, query: {}, params: {}, userID: "u1", ...o };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
};

describe("getAllUsers", () => {
  it("404 when none found", async () => {
    UserDAO.getUsers.mockResolvedValue({ usersList: [], numUsers: 0 });
    const { req, res } = mk({ query: {} });
    await getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("200 with users list", async () => {
    UserDAO.getUsers.mockResolvedValue({ usersList: [{ userID: "u1" }], numUsers: 1 });
    const { req, res } = mk({ query: {} });
    await getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("respects page/usersPerPage params", async () => {
    UserDAO.getUsers.mockResolvedValue({ usersList: [{ userID: "u1" }], numUsers: 1 });
    const { req, res } = mk({ query: { page: "1", usersPerPage: "5" } });
    await getAllUsers(req, res);
    expect(UserDAO.getUsers).toHaveBeenCalledWith({ page: 1, usersPerPage: 5 });
  });
});

describe("getUser", () => {
  it("404 when not found", async () => {
    UserDAO.getUserByID.mockResolvedValue(null);
    const { req, res } = mk();
    await getUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("200 with user data", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID: "u1" });
    const { req, res } = mk();
    await getUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getUserById", () => {
  it("404 when not found", async () => {
    UserDAO.getUserByID.mockResolvedValue(null);
    const { req, res } = mk({ params: { id: "x" } });
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("403 for immutable user", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID: "u99", access: 15 });
    const { req, res } = mk({ params: { id: "u99" } });
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("200 for normal user", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID: "u1", access: 7 });
    const { req, res } = mk({ params: { id: "u1" } });
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("postUser", () => {
  it("400 when fields missing", async () => {
    const { req, res } = mk({ body: { firstName: "A" } });
    await postUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("400 when access out of range", async () => {
    const { req, res } = mk({ body: { firstName:"A", lastName:"B", username:"ab", password:"Str0ng!", access: 99 } });
    await postUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("409 when username taken", async () => {
    UserDAO.doesUsernameExist.mockResolvedValue(true);
    const { req, res } = mk({ body: { firstName:"A", lastName:"B", username:"taken", password:"Str0ng@1", access:4 } });
    await postUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it("400 when password too weak", async () => {
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    const { req, res } = mk({ body: { firstName:"A", lastName:"B", username:"u", password:"weak" } });
    await postUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("201 on success", async () => {
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    UserDAO.addUser.mockResolvedValue({ userID: "new" });
    const { req, res } = mk({ body: { firstName:"Alice", lastName:"S", username:"alice", password:"Str0ng@1!" } });
    await postUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  it("400 when addUser returns error", async () => {
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    UserDAO.addUser.mockResolvedValue({ error: new Error("db") });
    const { req, res } = mk({ body: { firstName:"Alice", lastName:"S", username:"alice2", password:"Str0ng@1!" } });
    await postUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("updateUser", () => {
  it("400 when userID missing", async () => {
    const { req, res } = mk({ body: {} });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("400 when access out of range", async () => {
    const { req, res } = mk({ body: { userID:"u1", access: 99 } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("400 when password weak", async () => {
    const { req, res } = mk({ body: { userID:"u1", password:"weak" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when user not found", async () => {
    UserDAO.getUserByID.mockResolvedValue(null);
    const { req, res } = mk({ body: { userID:"missing" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("403 when user immutable", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:15, firstName:"X", lastName:"Y" });
    const { req, res } = mk({ body: { userID:"u1" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("409 when new username taken", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice", firstName:"A", lastName:"B" });
    UserDAO.doesUsernameExist.mockResolvedValue(true);
    const { req, res } = mk({ body: { userID:"u1", username:"taken" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it("200 on success", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice", firstName:"A", lastName:"B" });
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    UserDAO.updateUser.mockResolvedValue({ modifiedCount: 1 });
    const { req, res } = mk({ body: { userID:"u1", firstName:"Bob" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("400 when updateUser returns error", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice", firstName:"A", lastName:"B" });
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    UserDAO.updateUser.mockResolvedValue({ error: new Error("fail"), modifiedCount: 0 });
    const { req, res } = mk({ body: { userID:"u1", firstName:"Bob" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("can set access to 0 (falsy but valid)", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice", firstName:"A", lastName:"B" });
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    UserDAO.updateUser.mockResolvedValue({ modifiedCount: 1 });
    const { req, res } = mk({ body: { userID:"u1", access: 0 } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteUser", () => {
  it("400 when uid missing", async () => {
    const { req, res } = mk({ query: {} });
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when not found", async () => {
    UserDAO.getUserByID.mockResolvedValue(null);
    const { req, res } = mk({ query: { uid: "ghost" } });
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("403 when immutable", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:15, firstName:"X", lastName:"Y" });
    const { req, res } = mk({ query: { uid: "u1" } });
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("200 on success", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, firstName:"Alice", lastName:"S" });
    UserDAO.deleteUser.mockResolvedValue({});
    const { req, res } = mk({ query: { uid: "u1" } });
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("400 when deleteUser errors", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, firstName:"Alice", lastName:"S" });
    UserDAO.deleteUser.mockResolvedValue({ error: new Error("fail") });
    const { req, res } = mk({ query: { uid: "u1" } });
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("resetPassword", () => {
  it("400 when password missing", async () => {
    const { req, res } = mk({ body: {} });
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("400 when password weak", async () => {
    const { req, res } = mk({ body: { password:"weak" } });
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("404 when user not found", async () => {
    UserDAO.getUserByID.mockResolvedValue(null);
    const { req, res } = mk({ body: { password:"Str0ng@1!" } });
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("403 when user immutable", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:15 });
    const { req, res } = mk({ body: { password:"Str0ng@1!" } });
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("200 on success", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice" });
    UserDAO.updateUser.mockResolvedValue({ modifiedCount: 1 });
    const { req, res } = mk({ body: { password:"Str0ng@1!" } });
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

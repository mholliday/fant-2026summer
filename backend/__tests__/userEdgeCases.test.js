"use strict";
jest.mock("../models/userDAO");

const UserDAO = require("../models/userDAO");
const { updateUser } = require("../controllers/userController");

const mk = (o = {}) => {
  const req = { body:{}, query:{}, params:{}, userID:"u1", ...o };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { req, res };
};

// Cover the modifiedCount===0 throw path in updateUser
describe("updateUser edge cases", () => {
  it("throws when modifiedCount is 0 and no error", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice", firstName:"A", lastName:"B" });
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    // Return no error but also no modification
    UserDAO.updateUser.mockResolvedValue({ modifiedCount: 0 });
    const { req, res } = mk({ body:{ userID:"u1", firstName:"Bob" } });
    await expect(updateUser(req, res)).rejects.toThrow("Unable to update User");
  });

  it("updates password when a strong password is provided", async () => {
    UserDAO.getUserByID.mockResolvedValue({ userID:"u1", access:7, username:"alice", firstName:"A", lastName:"B" });
    UserDAO.doesUsernameExist.mockResolvedValue(false);
    UserDAO.updateUser.mockResolvedValue({ modifiedCount: 1 });
    const { req, res } = mk({ body:{ userID:"u1", password:"Str0ng@1!" } });
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

"use strict";

// Mock fs/promises so logger does not write real files
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    mkdir:      jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
  },
}));

const { logEvents, logger } = require("../middleware/logger");
const errorHandler = require("../middleware/errorHandler");

describe("logger middleware", () => {
  it("logEvents writes a timestamped log entry", async () => {
    const fs = require("fs");
    await logEvents("test message", "test.log");
    expect(fs.promises.appendFile).toHaveBeenCalledWith(
      expect.stringContaining("test.log"),
      expect.stringContaining("test message")
    );
  });

  it("logEvents creates log dir when missing", async () => {
    const fs = require("fs");
    fs.existsSync.mockReturnValueOnce(false);
    await logEvents("msg", "log.log");
    expect(fs.promises.mkdir).toHaveBeenCalled();
  });

  it("logEvents handles appendFile error gracefully", async () => {
    const fs = require("fs");
    fs.promises.appendFile.mockRejectedValueOnce(new Error("write error"));
    await expect(logEvents("msg", "log.log")).resolves.not.toThrow();
  });

  it("logger middleware calls next and logs the request", () => {
    const req = { method: "GET", url: "/test", path: "/test", headers: { origin: "localhost" } };
    const res = {};
    const next = jest.fn();
    logger(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("errorHandler middleware", () => {
  it("uses statusCode 500 when res.statusCode is 200", () => {
    const err = new Error("Something broke");
    const req = { method: "GET", url: "/test", headers: { origin: "localhost" } };
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json:   jest.fn().mockReturnThis(),
    };
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Something broke" });
  });

  it("preserves existing non-200 statusCode", () => {
    const err = new Error("Not found");
    const req = { method: "GET", url: "/test", headers: { origin: "localhost" } };
    const res = {
      statusCode: 404,
      status: jest.fn().mockReturnThis(),
      json:   jest.fn().mockReturnThis(),
    };
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

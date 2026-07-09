"use strict";
jest.mock("../models/imageDAO");
jest.mock("../models/donorDAO");

const ImageDAO = require("../models/imageDAO");
const DonorDAO = require("../models/donorDAO");
const { uploadImage, listImages, downloadImage, deleteImage } = require("../controllers/imageController");

const mk = (o = {}) => {
  const req = { body: {}, query: {}, params: {}, userID: "u1", ...o };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    headersSent: false,
  };
  return { req, res };
};

const pngFile = { originalname: "scan.png", mimetype: "image/png", buffer: Buffer.from("abc") };

beforeEach(() => jest.clearAllMocks());

describe("uploadImage", () => {
  it("404 when donor does not exist", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    const { req, res } = mk({ params: { did: "2026-1" }, file: pngFile });
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("400 when no file provided", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    const { req, res } = mk({ params: { did: "2026-1" } });
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("400 on unsupported file type", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    const { req, res } = mk({ params: { did: "2026-1" }, file: { ...pngFile, mimetype: "application/pdf" } });
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("201 and returns metadata on success", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    ImageDAO.uploadImage.mockResolvedValue({ imageId: "abc123", donorID: "2026-1", filename: "scan.png" });
    const { req, res } = mk({ params: { did: "2026-1" }, file: pngFile });
    await uploadImage(req, res);
    expect(ImageDAO.uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({ donorID: "2026-1", filename: "scan.png", contentType: "image/png", uploadedBy: "u1" })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ image: expect.objectContaining({ imageId: "abc123" }) }));
  });
});

describe("listImages", () => {
  it("404 when donor does not exist", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(false);
    const { req, res } = mk({ params: { did: "2026-1" } });
    await listImages(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 with images array", async () => {
    DonorDAO.doesDonorExist.mockResolvedValue(true);
    const images = [{ imageId: "a", filename: "1.png" }];
    ImageDAO.listImagesByDonor.mockResolvedValue(images);
    const { req, res } = mk({ params: { did: "2026-1" } });
    await listImages(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ images });
  });
});

describe("downloadImage", () => {
  it("404 when image not found", async () => {
    ImageDAO.getImageMeta.mockResolvedValue(null);
    const { req, res } = mk({ params: { imageId: "missing" } });
    await downloadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("streams the image with headers on success", async () => {
    ImageDAO.getImageMeta.mockResolvedValue({ contentType: "image/png", size: 3, filename: "scan.png" });
    const fakeStream = { on: jest.fn().mockReturnThis(), pipe: jest.fn() };
    ImageDAO.openDownloadStream.mockReturnValue(fakeStream);
    const { req, res } = mk({ params: { imageId: "abc123" } });
    await downloadImage(req, res);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ "Content-Type": "image/png", "Content-Length": 3 })
    );
    expect(fakeStream.pipe).toHaveBeenCalledWith(res);
  });
});

describe("deleteImage", () => {
  it("404 when image not found", async () => {
    ImageDAO.getImageMeta.mockResolvedValue(null);
    const { req, res } = mk({ params: { imageId: "missing" } });
    await deleteImage(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 and deletes on success", async () => {
    ImageDAO.getImageMeta.mockResolvedValue({ imageId: "abc123", filename: "scan.png" });
    ImageDAO.deleteImage.mockResolvedValue();
    const { req, res } = mk({ params: { imageId: "abc123" } });
    await deleteImage(req, res);
    expect(ImageDAO.deleteImage).toHaveBeenCalledWith("abc123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ imageId: "abc123" }));
  });
});

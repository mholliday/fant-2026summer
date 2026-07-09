/**
 * Image controller — upload / list / download / delete donor image attachments.
 * Bytes are stored in GridFS via ImageDAO; see models/imageDAO.js.
 */
const asyncHandler = require("express-async-handler");
const ImageDAO = require("../models/imageDAO");
const DonorDAO = require("../models/donorDAO");

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/**
 * POST /donor/:did/images   (multipart/form-data, field "image")
 * Uploads a single image and attaches it to the donor.
 */
const uploadImage = asyncHandler(async (req, res) => {
  const did = req.params.did;

  if (!(await DonorDAO.doesDonorExist(did))) {
    return res.status(404).json({ message: "Donor not found" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  if (!ALLOWED_TYPES.has(req.file.mimetype)) {
    return res.status(400).json({ message: "Unsupported file type — images only (png, jpeg, gif, webp)" });
  }

  const meta = await ImageDAO.uploadImage({
    donorID: did,
    filename: req.file.originalname || "image",
    contentType: req.file.mimetype,
    buffer: req.file.buffer,
    uploadedBy: req.userID,
    caption: (req.body.caption ?? "").trim(),
  });

  res.status(201).json({ message: "Image uploaded", image: meta });
});

/**
 * PATCH /donor/images/:imageId   { caption }
 * Updates an image's caption/description.
 */
const updateImageCaption = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const caption = (req.body.caption ?? "").trim();

  const updated = await ImageDAO.updateCaption(imageId, caption);
  if (!updated) {
    return res.status(404).json({ message: "Image not found" });
  }

  res.status(200).json({ message: "Caption updated", image: updated });
});

/**
 * GET /donor/:did/images
 * Lists metadata for every image attached to the donor.
 */
const listImages = asyncHandler(async (req, res) => {
  const did = req.params.did;

  if (!(await DonorDAO.doesDonorExist(did))) {
    return res.status(404).json({ message: "Donor not found" });
  }

  const images = await ImageDAO.listImagesByDonor(did);
  res.status(200).json({ images });
});

/**
 * GET /donor/images/:imageId
 * Streams the raw image bytes. `?download=1` forces a file download.
 */
const downloadImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;

  const meta = await ImageDAO.getImageMeta(imageId);
  if (!meta) {
    return res.status(404).json({ message: "Image not found" });
  }

  const disposition = req.query.download ? "attachment" : "inline";
  res.set({
    "Content-Type": meta.contentType,
    "Content-Length": meta.size,
    "Content-Disposition": `${disposition}; filename="${meta.filename.replace(/"/g, "")}"`,
  });

  const stream = ImageDAO.openDownloadStream(imageId);
  stream.on("error", () => {
    if (!res.headersSent) res.status(500).json({ message: "Failed to read image" });
    else res.end();
  });
  stream.pipe(res);
});

/**
 * DELETE /donor/images/:imageId
 * Removes a single image.
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;

  const meta = await ImageDAO.getImageMeta(imageId);
  if (!meta) {
    return res.status(404).json({ message: "Image not found" });
  }

  await ImageDAO.deleteImage(imageId);
  res.status(200).json({ message: "Image deleted", imageId });
});

module.exports = { uploadImage, listImages, downloadImage, deleteImage, updateImageCaption };

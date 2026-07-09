/**
 * ImageDAO — stores donor image attachments in MongoDB GridFS.
 *
 * Files live in the `donorImages.files` / `donorImages.chunks` collections of
 * the same database, so they persist in the existing mongo_data volume and are
 * captured by ordinary DB backups. Each file carries metadata identifying the
 * donor it belongs to and who uploaded it. Images are attached per-donor (not
 * per-version) and persist across donor edits.
 */
const mongoose = require("mongoose");

const BUCKET_NAME = "donorImages";

// Lazily construct the bucket so it binds to the live connection. mongoose
// keeps a single default connection; its `.db` handle is ready once connected.
const bucket = () => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
};

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Shape a raw GridFS file document into the metadata the API returns.
const toMeta = (f) => ({
  imageId: f._id.toString(),
  donorID: f.metadata?.donorID ?? null,
  filename: f.filename,
  caption: f.metadata?.caption ?? "",
  contentType: f.metadata?.contentType ?? f.contentType ?? "application/octet-stream",
  size: f.length,
  uploadTime: f.uploadDate,
  uploadedBy: f.metadata?.uploadedBy ?? null,
});

class ImageDAO {
  static isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Streams a buffer into GridFS. Resolves with the new file's metadata.
   */
  static uploadImage({ donorID, filename, contentType, buffer, uploadedBy, caption = "" }) {
    return new Promise((resolve, reject) => {
      const uploadStream = bucket().openUploadStream(filename, {
        contentType,
        metadata: { donorID, contentType, uploadedBy, caption, uploadTime: new Date() },
      });
      uploadStream.on("error", reject);
      uploadStream.on("finish", () =>
        resolve({
          imageId: uploadStream.id.toString(),
          donorID,
          filename,
          caption,
          contentType,
          size: buffer.length,
          uploadedBy,
        })
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Updates an image's caption in place. Returns the updated metadata, or null
   * if the image does not exist. GridFSBucket has no metadata-update API, so we
   * edit the `<bucket>.files` document directly.
   */
  static async updateCaption(imageId, caption) {
    if (!this.isValidId(imageId)) return null;
    const files = mongoose.connection.db.collection(`${BUCKET_NAME}.files`);
    const res = await files.updateOne(
      { _id: toObjectId(imageId) },
      { $set: { "metadata.caption": caption } }
    );
    if (res.matchedCount === 0) return null;
    return this.getImageMeta(imageId);
  }

  /**
   * Lists metadata for every image attached to a donor (newest first).
   */
  static async listImagesByDonor(donorID) {
    const files = await bucket()
      .find({ "metadata.donorID": donorID })
      .sort({ uploadDate: -1 })
      .toArray();
    return files.map(toMeta);
  }

  /**
   * Returns a single image's metadata, or null if it does not exist.
   */
  static async getImageMeta(imageId) {
    if (!this.isValidId(imageId)) return null;
    const [file] = await bucket().find({ _id: toObjectId(imageId) }).toArray();
    return file ? toMeta(file) : null;
  }

  /**
   * Opens a readable stream of the image bytes (for piping to a response).
   */
  static openDownloadStream(imageId) {
    return bucket().openDownloadStream(toObjectId(imageId));
  }

  /**
   * Reads an image fully into a Buffer (used when embedding into the PDF).
   */
  static getImageBuffer(imageId) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      this.openDownloadStream(imageId)
        .on("data", (c) => chunks.push(c))
        .on("error", reject)
        .on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Returns every image for a donor as { filename, contentType, buffer },
   * ordered oldest-first for a stable PDF layout.
   */
  static async getImagesForDonor(donorID) {
    const files = await bucket()
      .find({ "metadata.donorID": donorID })
      .sort({ uploadDate: 1 })
      .toArray();
    const out = [];
    for (const f of files) {
      const buffer = await this.getImageBuffer(f._id.toString());
      out.push({
        filename: f.filename,
        caption: f.metadata?.caption ?? "",
        contentType: f.metadata?.contentType ?? f.contentType ?? "image/png",
        buffer,
      });
    }
    return out;
  }

  /**
   * Deletes a single image. Throws if the id is missing from GridFS.
   */
  static async deleteImage(imageId) {
    await bucket().delete(toObjectId(imageId));
  }

  /**
   * Deletes every image attached to a donor (used when a donor is permanently
   * deleted). Best-effort: continues past individual failures.
   */
  static async deleteImagesByDonorID(donorID) {
    const files = await bucket().find({ "metadata.donorID": donorID }).toArray();
    for (const f of files) {
      try {
        await bucket().delete(f._id);
      } catch (e) {
        console.error(`Failed to delete image ${f._id}: ${e}`);
      }
    }
    return files.length;
  }
}

module.exports = ImageDAO;

const express = require("express");
const multer = require("multer");
const DonorCtrl = require("../controllers/donorController");
const ImageCtrl = require("../controllers/imageController");
const archivedFilter = require("../middleware/archivedFilter");
const { readChecker, writeChecker, authChecker, adminChecker } = require("../middleware/accessChecker");

const router = express.Router();

router.use(authChecker);

// In-memory upload (buffer is streamed straight into GridFS by the controller).
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB per image
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES } });

// Wrap multer so its errors return clean JSON instead of a 500.
const uploadImageField = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Image exceeds the 15MB limit" });
      }
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    next();
  });
};

router
  .route("/")
  .get(readChecker, archivedFilter(false), DonorCtrl.getAllMostRecentDonors)
  .post(writeChecker, DonorCtrl.createNewDonor)
  .put(writeChecker, DonorCtrl.addNewDonorVersion)
  .delete(writeChecker, DonorCtrl.archiveDonor);

router
  .route("/version")
  .get(readChecker, DonorCtrl.getDonorVersions)
  .put(adminChecker, DonorCtrl.restoreDonorVersion);

router
  .route("/archive")
  .get(readChecker, archivedFilter(true), DonorCtrl.getAllMostRecentDonors)
  .put(writeChecker, DonorCtrl.restoreArchivedDonor)
  .delete(adminChecker, DonorCtrl.deleteArchivedDonor);

router.route("/next-id").get(writeChecker, DonorCtrl.getNextID);
router.route("/pdf").get(readChecker, DonorCtrl.getPDF);

// Image attachments (registered before "/:did" so the literal paths win).
router
  .route("/images/:imageId")
  .get(readChecker, ImageCtrl.downloadImage)
  .delete(writeChecker, ImageCtrl.deleteImage);

router
  .route("/:did/images")
  .get(readChecker, ImageCtrl.listImages)
  .post(writeChecker, uploadImageField, ImageCtrl.uploadImage);

router.route("/:did").get(readChecker, DonorCtrl.getDonorById);

module.exports = router;

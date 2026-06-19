const express = require("express");
const DonorCtrl = require("../controllers/donorController");
const archivedFilter = require("../middleware/archivedFilter");
const { readChecker, writeChecker, authChecker, adminChecker } = require("../middleware/accessChecker");

const router = express.Router();

router.use(authChecker);

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
router.route("/:did").get(readChecker, DonorCtrl.getDonorById);

module.exports = router;

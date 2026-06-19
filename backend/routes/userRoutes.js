const express = require("express");
const UsersCtrl = require("../controllers/userController");
const { adminChecker, authChecker } = require("../middleware/accessChecker");

const router = express.Router();

router.use(authChecker);

router
  .route("/")
  .get(UsersCtrl.getUser)
  .post(adminChecker, UsersCtrl.postUser)
  .put(adminChecker, UsersCtrl.updateUser)
  .delete(adminChecker, UsersCtrl.deleteUser);

router.route("/all").get(adminChecker, UsersCtrl.getAllUsers);
router.route("/reset-password").put(UsersCtrl.resetPassword);
router.route("/:id").get(adminChecker, UsersCtrl.getUserById);

module.exports = router;

const express = require("express");
const AuthCtrl = require("../controllers/authController");
const loginLimiter = require("../middleware/loginLimit");

const router = express.Router();

router.route("/login").post(loginLimiter, AuthCtrl.login);
router.route("/refresh").get(AuthCtrl.refresh);
router.route("/logout").post(AuthCtrl.logout);

module.exports = router;

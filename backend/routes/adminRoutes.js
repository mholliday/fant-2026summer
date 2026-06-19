const express = require('express');
const AdminCtrl = require('../controllers/adminController');
const { authChecker, adminChecker } = require('../middleware/accessChecker');

const router = express.Router();

router.use(authChecker);
router.use(adminChecker);

router.get('/backup',  AdminCtrl.backup);
router.post('/restore', express.json({ limit: '100mb' }), AdminCtrl.restore);

module.exports = router;

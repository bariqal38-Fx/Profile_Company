const express = require('express');
const userAuth = require('../middleware/userAuth');
const adminAuth = require('../middleware/adminAuth');
const controller = require('../controllers/permintaan.controller');

const router = express.Router();

router.get('/saya', userAuth.requireUser, controller.listForUser);
router.post('/', userAuth.requireUser, controller.createForUser);
router.get('/admin', adminAuth.requireAdmin, controller.listForAdmin);
router.patch('/admin/:id', adminAuth.requireAdmin, controller.updateStatus);
router.delete('/admin/:id', adminAuth.requireAdmin, controller.remove);

module.exports = router;

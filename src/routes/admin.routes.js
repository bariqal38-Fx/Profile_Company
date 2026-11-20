const express = require('express');
const auth = require('../middleware/adminAuth');
const controller = require('../controllers/admin.controller');

const router = express.Router();

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', auth.requireAdmin, controller.whoAmI);
router.get('/pengguna', auth.requireAdmin, controller.listUsers);
router.post('/pengguna', auth.requireAdmin, controller.createUser);
router.put('/pengguna/:id', auth.requireAdmin, controller.updateUser);
router.delete('/pengguna/:id', auth.requireAdmin, controller.deleteUser);
router.get('/pesan', auth.requireAdmin, controller.listMessages);
router.patch('/pesan/:id', auth.requireAdmin, controller.updateMessageStatus);
router.delete('/pesan/:id', auth.requireAdmin, controller.deleteMessage);

module.exports = router;

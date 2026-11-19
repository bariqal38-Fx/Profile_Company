const express = require('express');
const controller = require('../controllers/auth.controller');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', userAuth.requireUser, controller.me);
router.post('/logout', controller.logout);

module.exports = router;

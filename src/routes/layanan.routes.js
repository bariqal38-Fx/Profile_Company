const express = require('express');
const controller = require('../controllers/layanan.controller');
const auth = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', auth.requireAdmin, controller.create);
router.put('/:id', auth.requireAdmin, controller.update);
router.delete('/:id', auth.requireAdmin, controller.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const recController = require('../controllers/recController');
const auth = require('../middleware/auth');

router.get('/', recController.getAllRECs.bind(recController));
router.post('/mint', auth, recController.mintREC.bind(recController));
router.post('/:id/purchase', auth, recController.purchaseREC.bind(recController));
router.post('/:id/retire', auth, recController.retireREC.bind(recController));

module.exports = router;

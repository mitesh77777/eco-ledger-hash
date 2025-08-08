const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/nonce', authController.getNonce.bind(authController));
router.post('/verify', authController.verify.bind(authController));

module.exports = router;

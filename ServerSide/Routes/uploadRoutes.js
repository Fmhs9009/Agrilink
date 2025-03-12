const express = require('express');
const router = express.Router();
const { uploadImage } = require('../Controller/UploadController');
const { verifyToken, isFarmer } = require('../Middleware/auth');

// Upload image route (only for authenticated farmers)
router.post('/image', verifyToken, isFarmer, uploadImage);

module.exports = router; 
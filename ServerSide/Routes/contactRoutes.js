const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../Controller/ContactController');

// POST request to submit contact form
router.post('/submit', submitContactForm);

module.exports = router; 
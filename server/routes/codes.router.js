const express = require('express');
const router = express.Router();
const { testConnection, generateCodes, getPartyCodes, validateCode, useCode, verifyAndAddParty } = require('../controllers/codes.controller');

// Test database connection
router.get('/test', testConnection);

// Generate entry codes for a party
router.post('/generate', generateCodes);

// Get all codes for a specific party
router.get('/party/:partyId', getPartyCodes);

// Validate an entry code
router.post('/validate', validateCode);

// Mark a code as used
router.post('/use', useCode);

// Verify code and add party to user's history
router.post('/verify-and-add', verifyAndAddParty);

module.exports = router;

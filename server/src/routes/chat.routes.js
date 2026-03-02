// src/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const { getAvailableUsers } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// GET /api/chats/available-users
router.get('/available-users', getAvailableUsers);

module.exports = router;
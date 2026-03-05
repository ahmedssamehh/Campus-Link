// src/routes/message.routes.js
const express = require('express');
const router = express.Router();
const {
    getGroupMessages,
    getPrivateMessages
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// GET /api/messages/group/:groupId - Get group chat history
router.get('/group/:groupId', getGroupMessages);

// GET /api/messages/private/:userId - Get private chat history
router.get('/private/:userId', getPrivateMessages);

module.exports = router;
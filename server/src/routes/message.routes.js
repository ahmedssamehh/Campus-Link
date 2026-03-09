// src/routes/message.routes.js
const express = require('express');
const router = express.Router();
const {
    getGroupMessages,
    getPrivateMessages,
    getUnreadCounts,
    markGroupRead,
    markPrivateRead
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// GET /api/messages/unread - Get unread counts for current user
router.get('/unread', getUnreadCounts);

// PATCH /api/messages/read/group/:groupId - Mark group messages as read
router.patch('/read/group/:groupId', markGroupRead);

// PATCH /api/messages/read/private/:userId - Mark private messages as read
router.patch('/read/private/:userId', markPrivateRead);

// GET /api/messages/group/:groupId - Get group chat history
router.get('/group/:groupId', getGroupMessages);

// GET /api/messages/private/:userId - Get private chat history
router.get('/private/:userId', getPrivateMessages);

module.exports = router;
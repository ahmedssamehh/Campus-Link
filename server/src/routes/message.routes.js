// src/routes/message.routes.js
const express = require('express');
const router = express.Router();
const {
    getGroupMessages,
    getPrivateMessages,
    getUnreadCounts,
    markGroupRead,
    markPrivateRead,
    editMessage,
    deleteMessage,
    uploadFiles,
    uploadMiddleware
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// GET /api/messages/unread - Get unread counts for current user
router.get('/unread', getUnreadCounts);

// PATCH /api/messages/read/group/:groupId - Mark group messages as read
router.patch('/read/group/:groupId', markGroupRead);

// PATCH /api/messages/read/private/:userId - Mark private messages as read
router.patch('/read/private/:userId', markPrivateRead);

// GET /api/messages/group/:groupId - Get group chat history (supports ?before=<ISO>)
router.get('/group/:groupId', getGroupMessages);

// GET /api/messages/private/:userId - Get private chat history (supports ?before=<ISO>)
router.get('/private/:userId', getPrivateMessages);

// PATCH /api/messages/:messageId/edit - Edit a message
router.patch('/:messageId/edit', editMessage);

// DELETE /api/messages/:messageId - Delete a message (soft)
router.delete('/:messageId', deleteMessage);

// POST /api/messages/upload - Upload file attachments
router.post('/upload', uploadMiddleware, uploadFiles);

module.exports = router;
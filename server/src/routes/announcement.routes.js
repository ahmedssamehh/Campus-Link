// src/routes/announcement.routes.js
const express = require('express');
const router = express.Router();
const {
    createAnnouncement,
    getMyAnnouncements,
    getLatestAnnouncements,
    getUnreadCount,
    markAsRead,
    deleteAnnouncement,
    getAllAnnouncements
} = require('../controllers/announcement.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// POST /api/announcements - Create announcement (admin, owner)
router.post('/', authorize('admin', 'owner'), createAnnouncement);

// GET /api/announcements/all - Get all announcements (admin, owner)
router.get('/all', authorize('admin', 'owner'), getAllAnnouncements);

// GET /api/announcements/my - Get user's announcements
router.get('/my', getMyAnnouncements);

// GET /api/announcements/latest - Get latest 5 announcements
router.get('/latest', getLatestAnnouncements);

// GET /api/announcements/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// PATCH /api/announcements/:id/read - Mark as read
router.patch('/:id/read', markAsRead);

// DELETE /api/announcements/:id - Delete announcement (admin, owner)
router.delete('/:id', authorize('admin', 'owner'), deleteAnnouncement);

module.exports = router;
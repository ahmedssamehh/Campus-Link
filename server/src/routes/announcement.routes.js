const express = require('express');
const router = express.Router();
const {
    createAnnouncement, createGroupAnnouncement,
    getMyAnnouncements, getLatestAnnouncements,
    getUnreadCount, markAsRead, deleteAnnouncement, getAllAnnouncements
} = require('../controllers/announcement.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validate');

router.use(protect);

router.post('/', authorize('admin', 'owner'), validate(schemas.createAnnouncement), createAnnouncement);
router.post('/group/:groupId', validate(schemas.createGroupAnnouncement), createGroupAnnouncement);
router.get('/all', authorize('admin', 'owner'), getAllAnnouncements);
router.get('/my', getMyAnnouncements);
router.get('/latest', getLatestAnnouncements);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.delete('/:id', authorize('admin', 'owner'), deleteAnnouncement);

module.exports = router;

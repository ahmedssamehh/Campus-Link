// src/controllers/announcement.controller.js
const Announcement = require('../models/Announcement');
const Group = require('../models/Group');

const getMemberGroupIds = async(userId) => {
    return Group.distinct('_id', { members: userId });
};

// @desc    Create announcement in a group
// @route   POST /api/announcements
// @access  Private (admin, owner)
exports.createAnnouncement = async(req, res) => {
    try {
        const { groupId, title, content } = req.body;

        // Validate input
        if (!groupId || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Group, title, and content are required'
            });
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Create announcement
        const announcement = await Announcement.create({
            group: groupId,
            createdBy: req.user._id,
            title,
            content
        });

        // Populate creator info
        await announcement.populate('createdBy', 'name email');
        await announcement.populate('group', 'name');

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating announcement',
            error: error.message
        });
    }
};

// @desc    Get announcements for user's groups
// @route   GET /api/announcements/my
// @access  Private
exports.getMyAnnouncements = async(req, res) => {
    try {
        const groupIds = await getMemberGroupIds(req.user._id);

        if (groupIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                announcements: []
            });
        }

        const announcements = await Announcement.find({ group: { $in: groupIds } })
            .populate('createdBy', 'name email role')
            .populate('group', 'name subject')
            .sort({ createdAt: -1 });

        // Add isRead flag for each announcement
        const announcementsWithReadStatus = announcements.map(ann => ({
            ...ann.toObject(),
            isRead: ann.readBy.some(id => id.toString() === req.user._id.toString())
        }));

        res.status(200).json({
            success: true,
            count: announcements.length,
            announcements: announcementsWithReadStatus
        });
    } catch (error) {
        console.error('Get my announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcements',
            error: error.message
        });
    }
};

// @desc    Get latest announcements for user
// @route   GET /api/announcements/latest
// @access  Private
exports.getLatestAnnouncements = async(req, res) => {
    try {
        const groupIds = await getMemberGroupIds(req.user._id);

        if (groupIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                announcements: []
            });
        }

        const announcements = await Announcement.find({ group: { $in: groupIds } })
            .populate('createdBy', 'name email role')
            .populate('group', 'name subject')
            .sort({ createdAt: -1 })
            .limit(5);

        // Add isRead flag for each announcement
        const announcementsWithReadStatus = announcements.map(ann => ({
            ...ann.toObject(),
            isRead: ann.readBy.some(id => id.toString() === req.user._id.toString())
        }));

        res.status(200).json({
            success: true,
            count: announcements.length,
            announcements: announcementsWithReadStatus
        });
    } catch (error) {
        console.error('Get latest announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching latest announcements',
            error: error.message
        });
    }
};

// @desc    Get unread announcements count
// @route   GET /api/announcements/unread-count
// @access  Private
exports.getUnreadCount = async(req, res) => {
    try {
        const groupIds = await getMemberGroupIds(req.user._id);

        if (groupIds.length === 0) {
            return res.status(200).json({
                success: true,
                unreadCount: 0
            });
        }

        const unreadCount = await Announcement.countDocuments({
            group: { $in: groupIds },
            readBy: { $ne: req.user._id }
        });

        res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count',
            error: error.message
        });
    }
};

// @desc    Mark announcement as read
// @route   PATCH /api/announcements/:id/read
// @access  Private
exports.markAsRead = async(req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        // Check if user is already in readBy array
        if (!announcement.readBy.includes(req.user._id)) {
            const isFirstRead = announcement.readBy.length === 0;

            announcement.readBy.push(req.user._id);

            // If this is the first read, update expiresAt to 15 days from now
            if (isFirstRead) {
                announcement.expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
            }

            await announcement.save();
        }

        res.status(200).json({
            success: true,
            message: 'Announcement marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking announcement as read',
            error: error.message
        });
    }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (admin, owner)
exports.deleteAnnouncement = async(req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        await Announcement.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting announcement',
            error: error.message
        });
    }
};

// @desc    Get all announcements (admin)
// @route   GET /api/announcements/all
// @access  Private (admin, owner)
exports.getAllAnnouncements = async(req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name email role')
            .populate('group', 'name subject')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: announcements.length,
            announcements
        });
    } catch (error) {
        console.error('Get all announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcements',
            error: error.message
        });
    }
};
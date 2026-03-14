// src/controllers/announcement.controller.js
const Announcement = require('../models/Announcement');
const Group = require('../models/Group');

const getMemberGroupIds = async(userId) => {
    return Group.distinct('_id', { members: userId });
};

const buildVisibilityFilter = (userId) => ({
    $or: [
        { visibleTo: { $exists: false } },
        { visibleTo: { $size: 0 } },
        { visibleTo: userId }
    ]
});

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

        const announcements = await Announcement.find({
                group: { $in: groupIds },
                ...buildVisibilityFilter(req.user._id)
            })
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

        const announcements = await Announcement.find({
                group: { $in: groupIds },
                ...buildVisibilityFilter(req.user._id)
            })
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
            ...buildVisibilityFilter(req.user._id),
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

        const isTargeted = announcement.visibleTo && announcement.visibleTo.length > 0;
        const isInVisibleTo = isTargeted &&
            announcement.visibleTo.some((id) => id.toString() === req.user._id.toString());

        // Targeted announcements (e.g. join-request notifications) are only visible to named users.
        // Group-wide announcements (visibleTo empty) require group membership.
        if (isTargeted && !isInVisibleTo) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this announcement'
            });
        }

        if (!isTargeted) {
            // Group-wide: verify membership
            const isMember = await Group.exists({ _id: announcement.group, members: req.user._id });
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this group'
                });
            }
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

// @desc    Create announcement for a specific group by group owner/admin
// @route   POST /api/announcements/group/:groupId
// @access  Private (group owner/admin only)
exports.createGroupAnnouncement = async(req, res) => {
    try {
        const { groupId } = req.params;
        const { title, content } = req.body;
        const userId = req.user._id.toString();

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Verify membership first (non-members cannot post)
        const group = await Group.findOne({ _id: groupId, members: req.user._id })
            .select('_id name createdBy admins members');

        if (!group) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        const isOwner = group.createdBy.toString() === userId;
        const isGroupAdmin = group.admins.some((adminId) => adminId.toString() === userId);

        if (!isOwner && !isGroupAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only group owner or group admins can create announcements'
            });
        }

        const announcement = await Announcement.create({
            group: group._id,
            createdBy: req.user._id,
            title: title.trim(),
            content: content.trim()
        });

        await announcement.populate('createdBy', 'name email role');
        await announcement.populate('group', 'name subject');

        // Realtime broadcast to connected members in this group room.
        const io = req.app.get('io');
        if (io) {
            const payload = {
                _id: announcement._id,
                group: announcement.group,
                createdBy: announcement.createdBy,
                title: announcement.title,
                content: announcement.content,
                createdAt: announcement.createdAt,
                updatedAt: announcement.updatedAt
            };

            io.to(`group:${group._id.toString()}`).emit('newAnnouncement', payload);
            // Backward compatibility with existing room usage in chat socket.
            io.to(group._id.toString()).emit('newAnnouncement', payload);
        }

        return res.status(201).json({
            success: true,
            message: 'Group announcement created successfully',
            announcement
        });
    } catch (error) {
        console.error('Create group announcement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating group announcement',
            error: error.message
        });
    }
};
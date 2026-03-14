// src/controllers/message.controller.js
const Message = require('../models/Message');
const Group = require('../models/Group');
const ChatMembership = require('../models/ChatMembership');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// ─── Multer config for file uploads ─────────────────────────
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${uuidv4()}${ext}`);
    }
});

const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: function(req, file, cb) {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

exports.uploadMiddleware = upload.array('files', 5);

// @desc    Upload files and return attachment metadata
// @route   POST /api/messages/upload
// @access  Private
exports.uploadFiles = async(req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const attachments = req.files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        }));

        res.status(200).json({ success: true, attachments });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
};

// @desc    Get group message history (cursor-based pagination)
// @route   GET /api/messages/group/:groupId
// @access  Private (group members only)
exports.getGroupMessages = async(req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 50, before } = req.query;

        // Verify user is a member of the group
        const group = await Group.findById(groupId).select('members');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        const isMember = group.members.some(
            (m) => m.toString() === req.user._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        const parsedLimit = Math.min(parseInt(limit) || 50, 100);

        // Build query
        const query = { group: groupId };

        if (before) {
            // Cursor-based: fetch messages older than the given timestamp
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name email profilePhoto')
            .sort({ createdAt: -1 })
            .limit(parsedLimit);

        const total = await Message.countDocuments({ group: groupId });
        const hasMore = messages.length === parsedLimit;

        // Reverse so oldest is first (for chat display)
        messages.reverse();

        res.status(200).json({
            success: true,
            messages,
            hasMore,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                pages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (error) {
        console.error('Get group messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group messages',
            error: error.message
        });
    }
};

// @desc    Get private message history between two users (cursor-based pagination)
// @route   GET /api/messages/private/:userId
// @access  Private
exports.getPrivateMessages = async(req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;
        const { page = 1, limit = 50, before } = req.query;

        const parsedLimit = Math.min(parseInt(limit) || 50, 100);

        // Build query
        const query = {
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name email profilePhoto')
            .sort({ createdAt: -1 })
            .limit(parsedLimit);

        const total = await Message.countDocuments({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        });

        const hasMore = messages.length === parsedLimit;

        // Reverse so oldest is first
        messages.reverse();

        res.status(200).json({
            success: true,
            messages,
            hasMore,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                pages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (error) {
        console.error('Get private messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching private messages',
            error: error.message
        });
    }
};

// @desc    Get unread message counts for the current user
// @route   GET /api/messages/unread
// @access  Private
exports.getUnreadCounts = async(req, res) => {
    try {
        const userId = req.user._id;

        // Find all groups the user belongs to
        const userGroups = await Group.find({ members: userId }).select('_id');
        const groupIds = userGroups.map((g) => g._id);

        // Count unread group messages: messages in user's groups where user is NOT in readBy
        const groupUnreads = await Message.aggregate([{
                $match: {
                    group: { $in: groupIds },
                    readBy: { $ne: userId }
                }
            },
            {
                $group: {
                    _id: '$group',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Count unread private messages: messages sent TO user where user is NOT in readBy
        const privateUnreads = await Message.aggregate([{
                $match: {
                    receiver: userId,
                    readBy: { $ne: userId }
                }
            },
            {
                $group: {
                    _id: '$sender',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Build response maps
        const groups = {};
        groupUnreads.forEach((g) => {
            groups[g._id.toString()] = g.count;
        });

        const privateChats = {};
        privateUnreads.forEach((p) => {
            privateChats[p._id.toString()] = p.count;
        });

        res.status(200).json({
            success: true,
            groups,
            private: privateChats
        });
    } catch (error) {
        console.error('Get unread counts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread counts',
            error: error.message
        });
    }
};

// @desc    Mark all messages in a group as read by the current user
// @route   PATCH /api/messages/read/group/:groupId
// @access  Private
exports.markGroupRead = async(req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;

        // Verify membership
        const group = await Group.findById(groupId).select('members');
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        const isMember = group.members.some((m) => m.toString() === userId.toString());
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'Not a member of this group' });
        }

        // Add userId to readBy for all unread messages in this group
        const result = await Message.updateMany({ group: groupId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });

        // Update ChatMembership
        await ChatMembership.findOneAndUpdate({ user: userId, chatType: 'group', chatId: groupId }, { lastSeenAt: new Date() }, { upsert: true });

        res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark group read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking messages as read',
            error: error.message
        });
    }
};

// @desc    Mark all private messages from a specific user as read
// @route   PATCH /api/messages/read/private/:userId
// @access  Private
exports.markPrivateRead = async(req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        // Add currentUserId to readBy for all unread messages from userId to currentUser
        const result = await Message.updateMany({ sender: userId, receiver: currentUserId, readBy: { $ne: currentUserId } }, { $addToSet: { readBy: currentUserId } });

        // Update ChatMembership
        const sorted = [currentUserId.toString(), userId].sort();
        const chatId = `private:${sorted[0]}-${sorted[1]}`;
        await ChatMembership.findOneAndUpdate({ user: currentUserId, chatType: 'private', chatId }, { lastSeenAt: new Date() }, { upsert: true });

        res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark private read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking messages as read',
            error: error.message
        });
    }
};

// @desc    Edit a message (via REST fallback)
// @route   PATCH /api/messages/:messageId/edit
// @access  Private (sender only)
exports.editMessage = async(req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id.toString();

        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
        }

        if (message.deleted) {
            return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
        }

        const sanitized = content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim()
            .substring(0, 5000);

        message.content = sanitized;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        res.status(200).json({ success: true, message });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ success: false, message: 'Error editing message', error: error.message });
    }
};

// @desc    Delete a message (soft delete, via REST fallback)
// @route   DELETE /api/messages/:messageId
// @access  Private (sender only)
exports.deleteMessage = async(req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id.toString();

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        message.deleted = true;
        message.deletedAt = new Date();
        message.deletedBy = userId;
        message.content = 'This message was deleted';
        message.attachments = [];
        message.reactions = [];
        await message.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, message: 'Error deleting message', error: error.message });
    }
};
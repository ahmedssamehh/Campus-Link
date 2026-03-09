// src/controllers/message.controller.js
const Message = require('../models/Message');
const Group = require('../models/Group');

// @desc    Get group message history
// @route   GET /api/messages/group/:groupId
// @access  Private (group members only)
exports.getGroupMessages = async(req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 50 } = req.query;

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

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find({ group: groupId })
            .populate('sender', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Message.countDocuments({ group: groupId });

        // Reverse so oldest is first (for chat display)
        messages.reverse();

        res.status(200).json({
            success: true,
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
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

// @desc    Get private message history between two users
// @route   GET /api/messages/private/:userId
// @access  Private
exports.getPrivateMessages = async(req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;
        const { page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Find messages between the two users (either direction)
        const messages = await Message.find({
                $or: [
                    { sender: currentUserId, receiver: userId },
                    { sender: userId, receiver: currentUserId }
                ]
            })
            .populate('sender', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Message.countDocuments({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        });

        // Reverse so oldest is first
        messages.reverse();

        res.status(200).json({
            success: true,
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
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
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
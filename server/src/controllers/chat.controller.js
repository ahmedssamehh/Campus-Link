// src/controllers/chat.controller.js
const Group = require('../models/Group');

// @desc    Get users available to chat with (share at least one group)
// @route   GET /api/chats/available-users
// @access  Private (authenticated users)
exports.getAvailableUsers = async(req, res) => {
    try {
        const currentUserId = req.user._id.toString();

        // 1. Find all groups where the current user is a member
        const myGroups = await Group.find({ members: req.user._id })
            .populate('members', 'name email profilePhoto')
            .select('members createdBy admins');

        if (myGroups.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                users: []
            });
        }

        const roleRank = { owner: 3, admin: 2, user: 1 };

        // 2. Collect all members, compute their best group-specific role across shared groups
        const usersMap = new Map();
        for (const group of myGroups) {
            const creatorId = group.createdBy ? group.createdBy.toString() : null;
            const adminIds = new Set((group.admins || []).map(a => a.toString()));

            for (const member of group.members) {
                const memberId = member._id.toString();
                if (memberId === currentUserId) continue;

                let groupRole;
                if (memberId === creatorId) groupRole = 'owner';
                else if (adminIds.has(memberId)) groupRole = 'admin';
                else groupRole = 'user';

                if (!usersMap.has(memberId)) {
                    usersMap.set(memberId, {
                        _id: member._id,
                        name: member.name,
                        email: member.email,
                        profilePhoto: member.profilePhoto || '',
                        role: groupRole,
                    });
                } else {
                    // Promote to higher role if found in another group
                    const existing = usersMap.get(memberId);
                    if ((roleRank[groupRole] || 0) > (roleRank[existing.role] || 0)) {
                        existing.role = groupRole;
                    }
                }
            }
        }

        const users = Array.from(usersMap.values());

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get available users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available users',
            error: error.message
        });
    }
};
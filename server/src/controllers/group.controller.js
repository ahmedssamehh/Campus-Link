// src/controllers/group.controller.js
const Group = require('../models/Group');
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Announcement = require('../models/Announcement');

// @desc    Create a new study group
// @route   POST /api/groups
// @access  Private (admin, owner)
exports.createGroup = async(req, res) => {
    try {
        console.log("🚀 CREATE GROUP CONTROLLER HIT");
        console.log("BODY:", req.body);
        console.log("USER:", req.user);

        const group = await require("../models/Group").create({
            name: req.body.name,
            subject: req.body.subject,
            description: req.body.description,
            createdBy: req.user._id,
            admins: [req.user._id],
            members: [req.user._id],
        });

        console.log("✅ GROUP SAVED WITH ID:", group._id);

        // Save activity record
        Activity.create({ type: 'group', name: req.user.name || 'Unknown', action: 'created group "' + group.name + '"', date: group.createdAt }).catch(() => {});

        return res.status(201).json({
            success: true,
            data: group,
        });
    } catch (error) {
        console.error("❌ CREATE GROUP FAILED:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all study groups
// @route   GET /api/groups
// @access  Private (authenticated users)
exports.getAllGroups = async(req, res) => {
    try {
        const groups = await Group.find()
            .populate('createdBy', 'name email role profilePhoto')
            .populate('admins', 'name email role profilePhoto')
            .populate('members', 'name email role profilePhoto')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: groups.length,
            groups
        });
    } catch (error) {
        console.error('Get all groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching groups',
            error: error.message
        });
    }
};

// @desc    Request to join a group
// @route   POST /api/groups/:id/join
// @access  Private (user)
exports.requestToJoinGroup = async(req, res) => {
    try {
        const { id: groupId } = req.params;

        // Find the group
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is already a member
        if (group.members.includes(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this group'
            });
        }

        // Check if there's already a pending request
        const existingRequest = await JoinRequest.findOne({
            user: req.user._id,
            group: groupId
        });

        if (existingRequest) {
            // If already pending, prevent duplicate
            if (existingRequest.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending request for this group'
                });
            }

            // If rejected or approved, delete old request to allow new one
            await JoinRequest.findByIdAndDelete(existingRequest._id);
        }

        // Create join request
        const joinRequest = await JoinRequest.create({
            user: req.user._id,
            group: groupId,
            status: 'pending'
        });

        // Populate user and group info
        await joinRequest.populate('user', 'name email profilePhoto');
        await joinRequest.populate('group', 'name subject');

        res.status(201).json({
            success: true,
            message: 'Join request submitted successfully',
            joinRequest
        });
    } catch (error) {
        console.error('Request to join group error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You already have a request for this group'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error submitting join request',
            error: error.message
        });
    }
};

// @desc    Get all join requests
// @route   GET /api/groups/requests
// @access  Private (admin, owner)
exports.getJoinRequests = async(req, res) => {
    try {
        // Return all requests (pending, approved, rejected)
        // Approved/rejected requests will auto-delete after 15 days via TTL index
        const requests = await JoinRequest.find()
            .populate('user', 'name email profilePhoto')
            .populate('group', 'name subject')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error('Get join requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching join requests',
            error: error.message
        });
    }
};

// @desc    Approve join request
// @route   PATCH /api/groups/requests/:id/approve
// @access  Private (admin, owner)
exports.approveJoinRequest = async(req, res) => {
    try {
        const { id: requestId } = req.params;

        // Find the join request
        const joinRequest = await JoinRequest.findById(requestId)
            .populate('user', 'name email profilePhoto')
            .populate('group', 'name subject');

        if (!joinRequest) {
            return res.status(404).json({
                success: false,
                message: 'Join request not found'
            });
        }

        // Check if request is still pending
        if (joinRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `This request has already been ${joinRequest.status}`
            });
        }

        // Find the group
        const group = await Group.findById(joinRequest.group._id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is already a member
        if (group.members.includes(joinRequest.user._id)) {
            // Update request status anyway
            joinRequest.status = 'approved';
            await joinRequest.save();

            return res.status(400).json({
                success: false,
                message: 'User is already a member of this group'
            });
        }

        // Add user to group members
        group.members.push(joinRequest.user._id);
        await group.save();

        // Update request status
        joinRequest.status = 'approved';
        await joinRequest.save();

        // Create announcement to notify user of approval
        try {
            const approvedGroupId = group._id || joinRequest.group._id;
            const adminName = req.user.name || 'Admin';
            const requestedUserName = joinRequest.user.name || 'User';
            const groupName = joinRequest.group.name || 'this group';

            const allAdminIds = [...new Set([
                ...group.admins.map(a => a.toString()),
                group.createdBy.toString()
            ])].map(id => id);

            await Announcement.create([{
                    group: approvedGroupId,
                    createdBy: req.user._id,
                    title: 'Join Request Approved',
                    content: `Your request to join ${groupName} has been approved.`,
                    visibleTo: [joinRequest.user._id]
                },
                {
                    group: approvedGroupId,
                    createdBy: req.user._id,
                    title: 'Join Request Approved',
                    content: `${adminName} approved ${requestedUserName}'s request to join ${groupName}.`,
                    visibleTo: allAdminIds
                }
            ]);
        } catch (announcementError) {
            console.error('Error creating approval announcement:', announcementError);
            // Don't fail the request if announcement fails
        }

        res.status(200).json({
            success: true,
            message: `User ${joinRequest.user.name} has been added to ${joinRequest.group.name}`,
            joinRequest
        });
    } catch (error) {
        console.error('Approve join request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving join request',
            error: error.message
        });
    }
};

// @desc    Reject join request
// @route   PATCH /api/groups/requests/:id/reject
// @access  Private (admin, owner)
exports.rejectJoinRequest = async(req, res) => {
    try {
        const { id: requestId } = req.params;

        // Find the join request
        const joinRequest = await JoinRequest.findById(requestId)
            .populate('user', 'name email profilePhoto')
            .populate('group', 'name subject');

        if (!joinRequest) {
            return res.status(404).json({
                success: false,
                message: 'Join request not found'
            });
        }

        // Check if request is still pending
        if (joinRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `This request has already been ${joinRequest.status}`
            });
        }

        // Update request status to rejected
        joinRequest.status = 'rejected';
        await joinRequest.save();

        // Create announcement to notify user of rejection
        try {
            const rejectedGroupId = joinRequest.group._id;
            const adminName = req.user.name || 'Admin';
            const requestedUserName = joinRequest.user.name || 'User';
            const groupName = joinRequest.group.name || 'this group';

            const allAdminIds = [...new Set([
                ...group.admins.map(a => a.toString()),
                group.createdBy.toString()
            ])].map(id => id);

            await Announcement.create([{
                    group: rejectedGroupId,
                    createdBy: req.user._id,
                    title: 'Join Request Rejected',
                    content: `Your request to join ${groupName} has been rejected.`,
                    visibleTo: [joinRequest.user._id]
                },
                {
                    group: rejectedGroupId,
                    createdBy: req.user._id,
                    title: 'Join Request Rejected',
                    content: `${adminName} rejected ${requestedUserName}'s request to join ${groupName}.`,
                    visibleTo: allAdminIds
                }
            ]);
        } catch (announcementError) {
            console.error('Error creating rejection announcement:', announcementError);
            // Don't fail the request if announcement fails
        }

        res.status(200).json({
            success: true,
            message: `Join request from ${joinRequest.user.name} has been rejected`,
            joinRequest
        });
    } catch (error) {
        console.error('Reject join request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting join request',
            error: error.message
        });
    }
};

// @desc    Get groups where the current user is a member
// @route   GET /api/groups/my
// @access  Private (authenticated users)
exports.getMyGroups = async(req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id })
            .populate('createdBy', 'name email role profilePhoto')
            .populate('admins', 'name email role profilePhoto')
            .populate('members', 'name email role profilePhoto')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: groups.length,
            groups
        });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your groups',
            error: error.message
        });
    }
};

// @desc    Get single group details
// @route   GET /api/groups/:id
// @access  Private (authenticated users)
exports.getGroupById = async(req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id)
            .populate('createdBy', 'name email role profilePhoto')
            .populate('admins', 'name email role profilePhoto')
            .populate('members', 'name email role profilePhoto');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Only members (and system admins/owners) may view group details
        const isMember = group.members.some(
            m => m._id.toString() === req.user._id.toString()
        );
        const isSystemAdmin = req.user.role === 'admin' || req.user.role === 'owner';

        if (!isMember && !isSystemAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Compute per-member group-specific role
        const groupObj = group.toObject();
        const creatorId = groupObj.createdBy && groupObj.createdBy._id ?
            groupObj.createdBy._id.toString() :
            null;
        const adminIds = new Set((groupObj.admins || []).map(a => a._id.toString()));

        groupObj.members = (groupObj.members || []).map(member => {
            const memberId = member._id.toString();
            let groupRole;
            if (memberId === creatorId) groupRole = 'owner';
            else if (adminIds.has(memberId)) groupRole = 'admin';
            else groupRole = 'user';
            return {...member, role: groupRole };
        });

        res.status(200).json({
            success: true,
            group: groupObj
        });
    } catch (error) {
        console.error('Get group by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group',
            error: error.message
        });
    }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private (admin, owner)
exports.deleteGroup = async(req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        await Group.findByIdAndDelete(req.params.id);
        await JoinRequest.deleteMany({ group: req.params.id });
        res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ success: false, message: 'Error deleting group', error: error.message });
    }
};

// @desc    Remove a member from a group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private (admin, owner)
exports.removeMember = async(req, res) => {
    try {
        const { groupId, memberId } = req.params;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if the member exists in the group
        if (!group.members.includes(memberId)) {
            return res.status(400).json({ success: false, message: 'User is not a member of this group' });
        }

        // Prevent removing the group creator
        if (group.createdBy.toString() === memberId) {
            return res.status(400).json({ success: false, message: 'Cannot remove the group creator' });
        }

        // Remove member from members array
        group.members = group.members.filter(m => m.toString() !== memberId);

        // Also remove from admins if present
        if (group.admins.includes(memberId)) {
            group.admins = group.admins.filter(a => a.toString() !== memberId);
        }

        await group.save();

        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            group
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing member',
            error: error.message
        });
    }
};

// @desc    Leave a group (user leaves themselves)
// @route   DELETE /api/groups/:groupId/leave
// @access  Private
exports.leaveGroup = async(req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if the user is a member
        if (!group.members.includes(userId)) {
            return res.status(400).json({ success: false, message: 'You are not a member of this group' });
        }

        // Prevent the group creator from leaving
        if (group.createdBy.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: 'Group creator cannot leave the group. Delete the group instead.' });
        }

        // Remove user from members array
        group.members = group.members.filter(m => m.toString() !== userId.toString());

        // Also remove from admins if present
        if (group.admins.includes(userId)) {
            group.admins = group.admins.filter(a => a.toString() !== userId.toString());
        }

        await group.save();

        res.status(200).json({
            success: true,
            message: 'You have left the group successfully'
        });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({
            success: false,
            message: 'Error leaving group',
            error: error.message
        });
    }
};
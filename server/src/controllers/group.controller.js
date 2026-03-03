// src/controllers/group.controller.js
const Group = require('../models/Group');
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const Activity = require('../models/Activity');

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
            .populate('createdBy', 'name email role')
            .populate('admins', 'name email role')
            .populate('members', 'name email role')
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
            group: groupId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request for this group'
            });
        }

        // Create join request
        const joinRequest = await JoinRequest.create({
            user: req.user._id,
            group: groupId,
            status: 'pending'
        });

        // Populate user and group info
        await joinRequest.populate('user', 'name email');
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

// @desc    Get all pending join requests
// @route   GET /api/groups/requests
// @access  Private (admin, owner)
exports.getJoinRequests = async(req, res) => {
    try {
        const requests = await JoinRequest.find({ status: 'pending' })
            .populate('user', 'name email')
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
            .populate('user', 'name email')
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
            .populate('user', 'name email')
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
            .populate('createdBy', 'name email role')
            .populate('admins', 'name email role')
            .populate('members', 'name email role')
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
            .populate('createdBy', 'name email role')
            .populate('admins', 'name email role')
            .populate('members', 'name email role');

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
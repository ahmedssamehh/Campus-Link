// src/controllers/admin.controller.js
const User = require('../models/User');
const Group = require('../models/Group');
const JoinRequest = require('../models/JoinRequest');
const Activity = require('../models/Activity');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin, owner)
exports.getAllUsers = async(req, res) => {
    try {
        // Get all users excluding passwords
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Promote user to admin
// @route   PATCH /api/admin/promote/:userId
// @access  Private (admin, owner)
exports.promoteToAdmin = async(req, res) => {
    try {
        const { userId } = req.params;

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already admin or owner
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin'
            });
        }

        if (user.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify owner role'
            });
        }

        // Only promote users with role = 'user'
        if (user.role !== 'user') {
            return res.status(400).json({
                success: false,
                message: 'Can only promote users with role "user"'
            });
        }

        // Promote to admin
        user.role = 'admin';
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.name} has been promoted to admin`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Promote to admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error promoting user',
            error: error.message
        });
    }
};

// @desc    Demote admin to user
// @route   PATCH /api/admin/demote/:userId
// @access  Private (owner only)
exports.demoteToUser = async(req, res) => {
    try {
        const { userId } = req.params;

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Cannot demote owner
        if (user.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot demote owner'
            });
        }

        // Cannot demote self
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot demote yourself'
            });
        }

        // Check if user is already a regular user
        if (user.role === 'user') {
            return res.status(400).json({
                success: false,
                message: 'User is already a regular user'
            });
        }

        // Only demote admins
        if (user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Can only demote users with role "admin"'
            });
        }

        // Demote to user
        user.role = 'user';
        await user.save();

        res.status(200).json({
            success: true,
            message: `Admin ${user.name} has been demoted to user`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Demote to user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error demoting user',
            error: error.message
        });
    }
};

// @desc    Delete a user from the platform
// @route   DELETE /api/admin/users/:userId
// @access  Private (admin, owner)
exports.deleteUser = async(req, res) => {
    try {
        const { userId } = req.params;

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Cannot delete owner
        if (user.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete owner account'
            });
        }

        // Cannot delete yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Delete all groups created by this user
        const groupsCreated = await Group.find({ createdBy: userId });
        const groupIds = groupsCreated.map(g => g._id);
        await Group.deleteMany({ createdBy: userId });

        // Delete all join requests for groups created by this user
        await JoinRequest.deleteMany({ group: { $in: groupIds } });

        // Remove user from all group members and admins arrays
        await Group.updateMany({ $or: [{ members: userId }, { admins: userId }] }, { $pull: { members: userId, admins: userId } });

        // Delete all join requests from this user
        await JoinRequest.deleteMany({ user: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: `User ${user.name} has been deleted from the platform`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin, owner)
exports.getDashboardStats = async(req, res) => {
    try {
        const [totalUsers, totalGroups, pendingRequests, adminCount] = await Promise.all([
            User.countDocuments(),
            Group.countDocuments(),
            JoinRequest.countDocuments({ status: 'pending' }),
            User.countDocuments({ role: { $in: ['admin', 'owner'] } }),
        ]);

        // Seed Activity collection from existing users/groups if empty
        const activityCount = await Activity.countDocuments();
        if (activityCount === 0) {
            const [seedUsers, seedGroups] = await Promise.all([
                User.find().select('name createdAt').sort({ createdAt: -1 }).limit(50),
                Group.find().populate('createdBy', 'name').select('name createdBy createdAt').sort({ createdAt: -1 }).limit(50),
            ]);
            const docs = [
                ...seedUsers.map((u) => ({ type: 'user', name: u.name, action: 'joined the platform', date: u.createdAt })),
                ...seedGroups.map((g) => ({ type: 'group', name: g.createdBy && g.createdBy.name ? g.createdBy.name : 'Unknown', action: 'created group "' + g.name + '"', date: g.createdAt })),
            ];
            if (docs.length > 0) await Activity.insertMany(docs);
        }

        const activity = await Activity.find().sort({ date: -1 }).limit(6);

        res.status(200).json({
            success: true,
            stats: { totalUsers, totalGroups, pendingRequests, adminCount },
            activity,
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message,
        });
    }
};

// @desc    Get all activities
// @route   GET /api/admin/activity
// @access  Private (admin, owner)
exports.getAllActivities = async(req, res) => {
    try {
        const activities = await Activity.find().sort({ date: -1 });
        res.status(200).json({ success: true, activities });
    } catch (error) {
        console.error('Get all activities error:', error);
        res.status(500).json({ success: false, message: 'Error fetching activities', error: error.message });
    }
};

// @desc    Delete selected activities
// @route   DELETE /api/admin/activity
// @access  Private (admin, owner)
exports.deleteActivities = async(req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No activity IDs provided' });
        }
        const result = await Activity.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ success: true, message: result.deletedCount + ' activities deleted' });
    } catch (error) {
        console.error('Delete activities error:', error);
        res.status(500).json({ success: false, message: 'Error deleting activities', error: error.message });
    }
};

// @desc    Delete all activities
// @route   DELETE /api/admin/activity/all
// @access  Private (admin, owner)
exports.deleteAllActivities = async(req, res) => {
    try {
        await Activity.deleteMany({});
        res.status(200).json({ success: true, message: 'All activities deleted' });
    } catch (error) {
        console.error('Delete all activities error:', error);
        res.status(500).json({ success: false, message: 'Error deleting all activities', error: error.message });
    }
};
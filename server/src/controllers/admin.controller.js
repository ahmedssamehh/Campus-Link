// src/controllers/admin.controller.js
const User = require('../models/User');

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
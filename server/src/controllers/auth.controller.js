// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Group = require('../models/Group');
const JoinRequest = require('../models/JoinRequest');
const Message = require('../models/Message');
const Announcement = require('../models/Announcement');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const ChatMembership = require('../models/ChatMembership');

const profileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/profile');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `profile_${req.user?._id || Date.now()}_${Date.now()}${ext}`);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function(req, file, cb) {
        if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

exports.profileUploadMiddleware = profileUpload.single('profilePhoto');

const getAuthUserId = (req) => req.user?._id || req.user?.id || null;

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async(req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: 'user'
        });

        // Save activity record
        Activity.create({ type: 'user', name: user.name, action: 'joined the platform', date: user.createdAt }).catch(() => {});

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || ''
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async(req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || ''
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};

// @desc    Update profile (name + optional profile photo). Email cannot be changed.
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async(req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const updates = {};

        if (typeof req.body.name === 'string' && req.body.name.trim()) {
            updates.name = req.body.name.trim();
        }

        if (req.file) {
            updates.profilePhoto = `/uploads/profile/${req.file.filename}`;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid profile fields provided'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (updates.name) {
            user.name = updates.name;
        }
        if (updates.profilePhoto) {
            user.profilePhoto = updates.profilePhoto;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || ''
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// @desc    Change password (must provide old password first)
// @route   PATCH /api/auth/change-password
// @access  Private
exports.changePassword = async(req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Old password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isOldPasswordValid = await user.comparePassword(oldPassword);
        if (!isOldPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Old password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// @desc    Delete own account
// @route   DELETE /api/auth/account
// @access  Private
exports.deleteAccount = async(req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Delete groups created by this user (and dependent group-scoped docs)
        const createdGroups = await Group.find({ createdBy: userId }).select('_id');
        const createdGroupIds = createdGroups.map((g) => g._id);

        if (createdGroupIds.length > 0) {
            await Promise.all([
                JoinRequest.deleteMany({ group: { $in: createdGroupIds } }),
                Announcement.deleteMany({ group: { $in: createdGroupIds } }),
                Message.deleteMany({ group: { $in: createdGroupIds } }),
                Group.deleteMany({ _id: { $in: createdGroupIds } })
            ]);
        }

        // Remove user from remaining groups
        await Group.updateMany({}, { $pull: { members: userId, admins: userId } });

        // Remove or clean dependent data
        await Promise.all([
            JoinRequest.deleteMany({ user: userId }),
            Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            ChatMembership.deleteMany({ user: userId }),
            Announcement.deleteMany({ createdBy: userId }),
            Announcement.updateMany({}, { $pull: { readBy: userId, visibleTo: userId } }),
            Message.updateMany({}, { $pull: { readBy: userId, deliveredTo: userId } }),
            Answer.deleteMany({ author: userId })
        ]);

        // Delete user's questions and their answers
        const userQuestions = await Question.find({ author: userId }).select('_id');
        const userQuestionIds = userQuestions.map((q) => q._id);
        if (userQuestionIds.length > 0) {
            await Answer.deleteMany({ question: { $in: userQuestionIds } });
            await Question.deleteMany({ _id: { $in: userQuestionIds } });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting account',
            error: error.message
        });
    }
};
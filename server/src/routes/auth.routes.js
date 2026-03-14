// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    resetPassword,
    getMe,
    updateProfile,
    changePassword,
    deleteAccount,
    profileUploadMiddleware
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, profileUploadMiddleware, updateProfile);
router.patch('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;
// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, promoteToAdmin, demoteToUser } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected and require authentication
// Apply protect middleware to all routes
router.use(protect);

// GET /api/admin/users - Get all users (admin and owner)
router.get('/users', authorize('admin', 'owner'), getAllUsers);

// PATCH /api/admin/promote/:userId - Promote user to admin (admin and owner)
router.patch('/promote/:userId', authorize('admin', 'owner'), promoteToAdmin);

// PATCH /api/admin/demote/:userId - Demote admin to user (owner only)
router.patch('/demote/:userId', authorize('owner'), demoteToUser);

module.exports = router;
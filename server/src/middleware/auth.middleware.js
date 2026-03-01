// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async(req, res, next) => {
    try {
        console.log('🔐 Protect middleware called for:', req.method, req.originalUrl);
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('✅ Token found in header');
        }

        // Check if token exists
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token verified. User ID:', decoded.id);

            // Get user from token
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                console.log('❌ User not found for ID:', decoded.id);
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log('✅ User authenticated:', { id: req.user._id, email: req.user.email, role: req.user.role });
            next();
        } catch (error) {
            console.log('❌ Token verification failed:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Invalid token.'
            });
        }
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Authorize specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        console.log('🔑 Authorize middleware called. Required roles:', roles, '- User role:', req.user.role);
        if (!roles.includes(req.user.role)) {
            console.log('❌ Authorization failed. User role not allowed.');
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        console.log('✅ Authorization passed');
        next();
    };
};
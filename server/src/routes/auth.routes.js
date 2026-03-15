const express = require('express');
const router = express.Router();
const {
    register, login, forgotPassword, resetPassword,
    getMe, updateProfile, changePassword, deleteAccount,
    profileUploadMiddleware
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validate');

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/forgot-password', validate(schemas.forgotPassword), forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, profileUploadMiddleware, updateProfile);
router.patch('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;

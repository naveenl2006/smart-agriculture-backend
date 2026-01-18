const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    verifyOTP,
    resetPassword,
} = require('../controllers/authController');

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Password reset routes (public)
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;

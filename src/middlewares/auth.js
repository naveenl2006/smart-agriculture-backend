const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, env.jwtSecret);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn,
    });
};

module.exports = { protect, generateToken };

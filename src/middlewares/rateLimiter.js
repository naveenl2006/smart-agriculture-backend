const rateLimit = require('express-rate-limit');

// Helper: Skip OPTIONS (CORS preflight) requests from rate limiting
const skipOptions = (req) => req.method === 'OPTIONS';

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // increased for production
    skip: skipOptions,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth route rate limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // realistic for login attempts
    skip: skipOptions,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// AI prediction rate limiter
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 predictions per minute
    skip: skipOptions,
    message: {
        success: false,
        message: 'Too many prediction requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, aiLimiter };

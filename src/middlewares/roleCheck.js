const { ROLES } = require('../config/constants');

// Role-based access control middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`,
            });
        }

        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === ROLES.ADMIN) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
    }
};

// Check if user is farmer
const isFarmer = (req, res, next) => {
    if (req.user && req.user.role === ROLES.FARMER) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Farmer access required',
        });
    }
};

// Check if user is service provider
const isServiceProvider = (req, res, next) => {
    if (req.user && req.user.role === ROLES.SERVICE_PROVIDER) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Service provider access required',
        });
    }
};

module.exports = { authorize, isAdmin, isFarmer, isServiceProvider };

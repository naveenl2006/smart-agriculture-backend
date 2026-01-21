const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getAllNotifications,
    markAsRead,
    markAllAsRead
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// GET /api/notifications - Get all aggregated notifications
router.get('/', getAllNotifications);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', markAsRead);

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', markAllAsRead);

module.exports = router;

const WeatherAlert = require('../models/WeatherAlert');
const CropSchedule = require('../models/CropSchedule');
const MarketPrice = require('../models/MarketPrice');
const User = require('../models/User');

/**
 * Format relative time from date
 */
const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

/**
 * Get notification icon and type based on alert type
 */
const getNotificationStyle = (type, severity) => {
    const styles = {
        weather: {
            rain: { icon: '🌧️', iconType: 'info' },
            flood: { icon: '🌊', iconType: 'critical' },
            heatwave: { icon: '🔥', iconType: 'warning' },
            wind: { icon: '💨', iconType: 'warning' },
            drought: { icon: '🏜️', iconType: 'warning' },
            default: { icon: '⚠️', iconType: 'info' }
        },
        crop: {
            overdue: { icon: '🚨', iconType: 'critical' },
            today: { icon: '📋', iconType: 'warning' },
            upcoming: { icon: '🌱', iconType: 'info' }
        },
        market: {
            up: { icon: '📈', iconType: 'success' },
            down: { icon: '📉', iconType: 'warning' },
            default: { icon: '💰', iconType: 'info' }
        }
    };

    if (type === 'weather') {
        return styles.weather[severity] || styles.weather.default;
    }
    if (type === 'crop') {
        return styles.crop[severity] || styles.crop.upcoming;
    }
    if (type === 'market') {
        return styles.market[severity] || styles.market.default;
    }
    return { icon: '🔔', iconType: 'info' };
};

/**
 * @desc    Get all aggregated notifications for the user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const notifications = [];

        // 1. Weather Alerts - Only if user has a registered district
        if (user.location) {
            const weatherAlerts = await WeatherAlert.find({
                user: userId,
                expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 }).limit(10);

            weatherAlerts.forEach(alert => {
                const style = getNotificationStyle('weather', alert.alertType);
                notifications.push({
                    id: alert._id.toString(),
                    type: 'weather',
                    icon: style.icon,
                    iconType: alert.severity || style.iconType,
                    message: alert.message || alert.title,
                    time: getRelativeTime(alert.createdAt),
                    read: alert.isRead || false,
                    actionUrl: '/weather-alerts',
                    createdAt: alert.createdAt
                });
            });
        }

        // 2. Crop Tracking Alerts - Tasks due today or overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const schedules = await CropSchedule.find({
            user: userId,
            status: 'active'
        });

        schedules.forEach(schedule => {
            schedule.activities.forEach(activity => {
                if (activity.status !== 'pending') return;

                const activityDate = new Date(activity.scheduledDate);
                activityDate.setHours(0, 0, 0, 0);

                const isOverdue = activityDate < today;
                const isToday = activityDate.getTime() === today.getTime();

                if (isOverdue || isToday) {
                    const severity = isOverdue ? 'overdue' : 'today';
                    const style = getNotificationStyle('crop', severity);

                    notifications.push({
                        id: `crop_${schedule._id}_${activity._id}`,
                        type: 'crop',
                        icon: style.icon,
                        iconType: style.iconType,
                        message: isOverdue
                            ? `Overdue: ${activity.activityName} for ${schedule.cropName}`
                            : `Due today: ${activity.activityName} for ${schedule.cropName}`,
                        time: isOverdue
                            ? `Overdue by ${Math.floor((today - activityDate) / 86400000)} day(s)`
                            : 'Today',
                        read: false,
                        actionUrl: `/crop-tracking/${schedule._id}`,
                        createdAt: activity.scheduledDate
                    });
                }
            });
        });

        // 3. Market Price Notifications - Only show after 10:00 AM
        const currentHour = new Date().getHours();
        if (currentHour >= 10) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Get prices with significant changes (>5%)
            const priceAlerts = await MarketPrice.find({
                date: { $gte: todayStart },
                $or: [
                    { 'priceChange.percentage': { $gt: 5 } },
                    { 'priceChange.percentage': { $lt: -5 } }
                ]
            }).sort({ 'priceChange.percentage': -1 }).limit(5);

            if (priceAlerts.length > 0) {
                // Group into a single notification with summary
                const upCount = priceAlerts.filter(p => p.priceChange?.trend === 'up').length;
                const downCount = priceAlerts.filter(p => p.priceChange?.trend === 'down').length;

                let message = 'Market prices updated: ';
                if (upCount > 0) message += `${upCount} item${upCount > 1 ? 's' : ''} increased`;
                if (upCount > 0 && downCount > 0) message += ', ';
                if (downCount > 0) message += `${downCount} item${downCount > 1 ? 's' : ''} decreased`;

                const style = getNotificationStyle('market', upCount > downCount ? 'up' : 'down');
                notifications.push({
                    id: `market_${todayStart.toISOString().split('T')[0]}`,
                    type: 'market',
                    icon: style.icon,
                    iconType: style.iconType,
                    message,
                    time: 'Today at 10:00 AM',
                    read: false,
                    actionUrl: '/market-price',
                    createdAt: new Date(todayStart.getTime() + 10 * 3600000) // 10 AM today
                });
            }
        }

        // Sort all notifications by createdAt (most recent first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate unread count
        const unreadCount = notifications.filter(n => !n.read).length;

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                total: notifications.length
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if it's a weather alert (MongoDB ObjectId format)
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            const alert = await WeatherAlert.findOneAndUpdate(
                { _id: id, user: userId },
                { isRead: true },
                { new: true }
            );

            if (alert) {
                return res.json({
                    success: true,
                    message: 'Notification marked as read'
                });
            }
        }

        // For crop and market notifications, we just return success
        // (they don't persist read state in DB, managed client-side)
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   POST /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        // Mark all weather alerts as read
        await WeatherAlert.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};

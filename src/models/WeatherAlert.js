const mongoose = require('mongoose');

const weatherAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    district: {
        type: String,
        required: true,
        trim: true
    },
    alertType: {
        type: String,
        enum: ['rain', 'heavy_rain', 'drought', 'heatwave', 'wind', 'flood'],
        required: true
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    recommendation: {
        type: String,
        default: ''
    },
    isRead: {
        type: Boolean,
        default: false
    },
    forecastDate: {
        type: Date
    },
    expiresAt: {
        type: Date,
        required: true
    },
    weatherData: {
        temperature: Number,
        humidity: Number,
        windSpeed: Number,
        precipitation: Number,
        rainProbability: Number
    }
}, {
    timestamps: true
});

// Index for efficient queries
weatherAlertSchema.index({ user: 1, isRead: 1 });
weatherAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to get unread count for a user
weatherAlertSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all alerts as read
weatherAlertSchema.statics.markAllAsRead = async function (userId) {
    return await this.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
    );
};

module.exports = mongoose.model('WeatherAlert', weatherAlertSchema);

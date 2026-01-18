const mongoose = require('mongoose');

const governmentNewsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    titleTamil: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        default: '📋', // Default emoji icon
    },
    category: {
        type: String,
        enum: ['farmers', 'officials', 'general', 'schemes', 'resources'],
        default: 'general',
    },
    order: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastScrapedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for unique URLs
governmentNewsSchema.index({ url: 1 }, { unique: true });

module.exports = mongoose.model('GovernmentNews', governmentNewsSchema);

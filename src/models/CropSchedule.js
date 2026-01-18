const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    stageName: {
        type: String,
        required: true
    },
    activityName: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    completedDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'skipped'],
        default: 'pending'
    }
});

const cropScheduleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropName: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    expectedHarvestDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'completed', 'cancelled'],
        default: 'planning'
    },
    activities: [activitySchema],
    notes: {
        type: String,
        maxLength: 1000
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Index for efficient queries
cropScheduleSchema.index({ user: 1, status: 1 });
cropScheduleSchema.index({ user: 1, cropName: 1 });

// Virtual for calculating progress
cropScheduleSchema.methods.calculateProgress = function () {
    if (this.activities.length === 0) return 0;
    const completed = this.activities.filter(a => a.status === 'completed').length;
    return Math.round((completed / this.activities.length) * 100);
};

// Pre-save hook to update progress percentage
cropScheduleSchema.pre('save', function () {
    this.progressPercentage = this.calculateProgress();
});

module.exports = mongoose.model('CropSchedule', cropScheduleSchema);

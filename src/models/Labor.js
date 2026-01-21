const mongoose = require('mongoose');
const { SKILL_LEVELS, BOOKING_STATUS } = require('../config/constants');

const laborSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
    },
    skills: [{
        skill: String,
        level: { type: String, enum: SKILL_LEVELS },
        experience: Number, // years
    }],
    specializations: [String],
    location: {
        state: String,
        district: String,
        village: String,
        pincode: String,
        latitude: {
            type: Number,
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180,
        },
    },
    availability: {
        isAvailable: { type: Boolean, default: true },
        preferredDays: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],
        preferredHours: {
            start: String,
            end: String,
        },
    },
    wages: {
        daily: Number,
        hourly: Number,
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    completedJobs: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    photo: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const laborHiringSchema = new mongoose.Schema({
    labor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labor',
        required: true,
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    workDescription: {
        type: String,
        required: true,
    },
    workType: {
        type: String,
        enum: ['sowing', 'harvesting', 'weeding', 'irrigation', 'pesticide_spraying', 'general', 'other'],
    },
    startDate: Date,
    endDate: Date,
    workHours: {
        start: String,
        end: String,
    },
    totalDays: Number,
    totalWages: Number,
    status: {
        type: String,
        enum: BOOKING_STATUS,
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending',
    },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Labor = mongoose.model('Labor', laborSchema);
const LaborHiring = mongoose.model('LaborHiring', laborHiringSchema);

module.exports = { Labor, LaborHiring };

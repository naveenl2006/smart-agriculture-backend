const mongoose = require('mongoose');

const VEHICLE_TYPES = ['tractor', 'harvester', 'rotavator', 'sprayer'];

const vehicleSchema = new mongoose.Schema({
    ownerName: {
        type: String,
        required: [true, 'Owner name is required'],
        trim: true,
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    vehicleType: {
        type: String,
        enum: {
            values: VEHICLE_TYPES,
            message: 'Vehicle type must be one of: tractor, harvester, rotavator, sprayer'
        },
        required: [true, 'Vehicle type is required'],
    },
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'],
    },
    perHourRent: {
        type: Number,
        required: [true, 'Per hour rent is required'],
        min: [0, 'Per hour rent cannot be negative'],
    },
    imagePath: {
        type: String,
        required: [true, 'Vehicle image is required'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for faster city-based queries
vehicleSchema.index({ location: 1 });
vehicleSchema.index({ vehicleNumber: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = { Vehicle, VEHICLE_TYPES };

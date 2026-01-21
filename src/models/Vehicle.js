const mongoose = require('mongoose');

const VEHICLE_TYPES = ['tractor', 'harvester', 'rotavator', 'sprayer', 'earth_mover', 'car', 'bike', 'equipment'];

const vehicleSchema = new mongoose.Schema({
    ownerName: {
        type: String,
        required: [true, 'Owner name is required'],
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
    },
    vehicleType: {
        type: String,
        enum: {
            values: VEHICLE_TYPES,
            message: 'Vehicle type must be one of: tractor, harvester, rotavator, sprayer, earth_mover, car, bike, equipment'
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
    pricePerDay: {
        type: Number,
        min: [0, 'Price per day cannot be negative'],
    },
    imagePath: {
        type: String,
        required: [true, 'Vehicle image is required'],
    },
    availabilityStatus: {
        type: Boolean,
        default: true,
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

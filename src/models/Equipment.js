const mongoose = require('mongoose');
const { EQUIPMENT_TYPES, BOOKING_STATUS } = require('../config/constants');

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: EQUIPMENT_TYPES,
        required: true,
    },
    description: String,
    specifications: {
        brand: String,
        model: String,
        horsepower: Number,
        capacity: String,
        fuelType: { type: String, enum: ['diesel', 'petrol', 'electric', 'manual'] },
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    location: {
        state: String,
        district: String,
        village: String,
        pincode: String,
    },
    pricing: {
        hourlyRate: Number,
        dailyRate: Number,
        deposit: Number,
    },
    availability: {
        isAvailable: { type: Boolean, default: true },
        nextAvailableDate: Date,
    },
    images: [String],
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    totalBookings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const equipmentBookingSchema = new mongoose.Schema({
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true,
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    duration: {
        value: Number,
        unit: { type: String, enum: ['hours', 'days'] },
    },
    totalCost: Number,
    deposit: Number,
    status: {
        type: String,
        enum: BOOKING_STATUS,
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'refunded'],
        default: 'pending',
    },
    notes: String,
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

const Equipment = mongoose.model('Equipment', equipmentSchema);
const EquipmentBooking = mongoose.model('EquipmentBooking', equipmentBookingSchema);

module.exports = { Equipment, EquipmentBooking };

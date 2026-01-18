const mongoose = require('mongoose');
const { SOIL_TYPES, WATER_AVAILABILITY, INDIAN_STATES } = require('../config/constants');

const farmerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    farmName: {
        type: String,
        trim: true,
        maxlength: [200, 'Farm name cannot exceed 200 characters'],
    },
    landSize: {
        value: { type: Number, required: true, min: 0 },
        unit: { type: String, enum: ['acres', 'hectares'], default: 'acres' },
    },
    location: {
        state: { type: String, enum: INDIAN_STATES },
        district: { type: String, trim: true },
        village: { type: String, trim: true },
        pincode: { type: String, match: [/^[0-9]{6}$/, 'Invalid pincode'] },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number },
        },
    },
    soilType: {
        type: String,
        enum: SOIL_TYPES,
    },
    waterAvailability: {
        type: String,
        enum: WATER_AVAILABILITY,
    },
    irrigationSource: {
        type: [String],
        enum: ['well', 'borewell', 'canal', 'river', 'rainwater', 'pond'],
    },
    currentCrops: [{
        crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
        plantedDate: Date,
        expectedHarvest: Date,
        area: Number,
    }],
    farmEquipment: [{
        name: String,
        quantity: Number,
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Farmer', farmerSchema);

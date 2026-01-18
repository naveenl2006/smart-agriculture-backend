const mongoose = require('mongoose');
const { SEASONS, SOIL_TYPES, WATER_AVAILABILITY } = require('../config/constants');

const cropSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    localName: {
        tamil: String,
        malayalam: String,
        hindi: String,
    },
    category: {
        type: String,
        enum: ['vegetable', 'fruit', 'grain', 'pulse', 'oilseed', 'spice', 'fiber', 'cash_crop'],
        required: true,
    },
    seasons: [{
        type: String,
        enum: SEASONS,
    }],
    suitableSoilTypes: [{
        type: String,
        enum: SOIL_TYPES,
    }],
    waterRequirement: {
        type: String,
        enum: WATER_AVAILABILITY,
    },
    growingPeriod: {
        min: Number, // days
        max: Number,
    },
    avgYield: {
        value: Number,
        unit: { type: String, default: 'kg/acre' },
    },
    fertilizers: [{
        name: String,
        quantity: String,
        stage: String,
    }],
    pesticides: [{
        name: String,
        forPest: String,
        dosage: String,
    }],
    marketPrice: {
        min: Number,
        max: Number,
        lastUpdated: Date,
    },
    imageUrl: String,
    description: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Crop', cropSchema);

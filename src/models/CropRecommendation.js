const mongoose = require('mongoose');

const cropRecommendationSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    inputData: {
        landSize: { value: Number, unit: String },
        soilType: String,
        waterAvailability: String,
        season: String,
        state: String,
        district: String,
    },
    recommendations: [{
        crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
        cropName: String,
        score: Number,
        expectedYield: { value: Number, unit: String },
        waterNeeded: { value: Number, unit: String },
        fertilizerNeeded: [{
            name: String,
            quantity: String,
        }],
        estimatedCost: Number,
        estimatedRevenue: Number,
        estimatedProfit: Number,
        growingPeriod: Number,
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    }],
    selectedCrop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('CropRecommendation', cropRecommendationSchema);

const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['disease', 'pest', 'deficiency'],
        required: true,
    },
    affectedCrops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
    }],
    symptoms: [String],
    cause: String,
    preventiveMeasures: [String],
    treatment: {
        medicines: [{
            name: String,
            type: { type: String, enum: ['pesticide', 'fungicide', 'insecticide', 'organic'] },
            dosage: String,
            applicationMethod: String,
        }],
        organicRemedies: [String],
        recoverySteps: [String],
        recoveryTime: String,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
    },
    spreadMethod: String,
    seasonalRisk: [{
        season: String,
        riskLevel: String,
    }],
    imageUrls: [String],
    description: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Disease', diseaseSchema);

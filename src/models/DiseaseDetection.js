const mongoose = require('mongoose');

const diseaseDetectionSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
    },
    imageUrl: {
        type: String,
        required: true,
    },
    originalFilename: String,
    cropType: String,
    prediction: {
        disease: { type: mongoose.Schema.Types.ObjectId, ref: 'Disease' },
        diseaseName: String,
        confidence: { type: Number, min: 0, max: 100 },
        isHealthy: Boolean,
        alternativePredictions: [{
            diseaseName: String,
            confidence: Number,
        }],
    },
    treatment: {
        medicines: [{
            name: String,
            dosage: String,
            applicationMethod: String,
        }],
        organicRemedies: [String],
        recoverySteps: [String],
        preventiveMeasures: [String],
    },
    feedback: {
        isCorrect: Boolean,
        actualDisease: String,
        comments: String,
    },
    location: {
        state: String,
        district: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('DiseaseDetection', diseaseDetectionSchema);

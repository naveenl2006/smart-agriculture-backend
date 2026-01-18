const mongoose = require('mongoose');

const seedAvailabilitySchema = new mongoose.Schema({
    districtId: {
        type: Number,
        required: true,
        index: true,
    },
    districtName: {
        type: String,
        required: true,
    },
    blockName: {
        type: String,
        required: true,
    },
    aecName: {
        type: String,
        required: true,
    },
    aecUrl: {
        type: String,
    },
    seeds: {
        paddy: { type: Number, default: 0 },
        cholam: { type: Number, default: 0 },
        maize: { type: Number, default: 0 },
        cumbu: { type: Number, default: 0 },
        ragi: { type: Number, default: 0 },
        kudiraivali: { type: Number, default: 0 },
        samai: { type: Number, default: 0 },
        varagu: { type: Number, default: 0 },
        thenai: { type: Number, default: 0 },
        redgram: { type: Number, default: 0 },
        blackgram: { type: Number, default: 0 },
        greengram: { type: Number, default: 0 },
        groundnut: { type: Number, default: 0 },
        gingelly: { type: Number, default: 0 },
        cotton: { type: Number, default: 0 },
        sunflower: { type: Number, default: 0 },
        horsegram: { type: Number, default: 0 },
        cowpea: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound index for efficient queries
seedAvailabilitySchema.index({ districtId: 1, blockName: 1, aecName: 1 });

module.exports = mongoose.model('SeedAvailability', seedAvailabilitySchema);

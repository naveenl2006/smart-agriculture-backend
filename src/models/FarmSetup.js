const mongoose = require('mongoose');

const farmSetupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    landSize: {
        type: Number,
        required: true,
        min: 10,
        max: 100,
    },
    landUnit: {
        type: String,
        enum: ['cents', 'acres'],
        default: 'cents',
    },
    farmingTypes: [{
        type: String,
        enum: ['hen', 'goat', 'cow', 'fish'],
    }],
    calculatedCapacity: {
        hen: {
            count: Number,
            shedArea: Number,
            feedArea: Number,
            eggCollectionArea: Number,
        },
        goat: {
            count: Number,
            shedArea: Number,
            grazingArea: Number,
            waterFeedArea: Number,
        },
        cow: {
            count: Number,
            shedArea: Number,
            milkingArea: Number,
            fodderStorage: Number,
        },
        fish: {
            pondArea: Number,
            pondDepth: Number,
            fishTypes: [String],
            estimatedFishCount: Number,
        },
    },
    profitEstimate: {
        monthly: {
            hen: Number,
            goat: Number,
            cow: Number,
            fish: Number,
            total: Number,
        },
        annual: {
            hen: Number,
            goat: Number,
            cow: Number,
            fish: Number,
            total: Number,
        },
    },
    seasonalRecommendations: [{
        farmingType: String,
        season: String,
        suitability: {
            type: String,
            enum: ['high', 'medium', 'low'],
        },
        notes: String,
    }],
    wasteReuseFlow: {
        hasBiogas: Boolean,
        biogasCapacity: Number,
        slurryForFertilizer: Boolean,
        slurryForFishPond: Boolean,
        notes: String,
    },
    waterRequirement: {
        level: {
            type: String,
            enum: ['low', 'moderate', 'high'],
        },
        dailyLiters: Number,
    },
    maintenanceLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
    },
    visualizationPrompt: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

farmSetupSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('FarmSetup', farmSetupSchema);

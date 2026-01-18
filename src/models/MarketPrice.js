const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
    commodity: {
        type: String,
        required: true,
        trim: true,
    },
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
    },
    market: {
        name: String,
        type: { type: String, enum: ['wholesale', 'retail', 'mandi'] },
        location: {
            state: String,
            district: String,
            city: String,
        },
    },
    price: {
        min: Number,
        max: Number,
        modal: Number, // most common price
        unit: { type: String, default: 'Rs/kg' },
    },
    quantity: {
        arrivals: Number, // quintals
        unit: { type: String, default: 'quintals' },
    },
    date: {
        type: Date,
        required: true,
    },
    priceChange: {
        value: Number,
        percentage: Number,
        trend: { type: String, enum: ['up', 'down', 'stable'] },
    },
    source: {
        type: String,
        default: 'vegetablemarketprice.com',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for efficient querying
marketPriceSchema.index({ commodity: 1, date: -1 });
marketPriceSchema.index({ 'market.location.state': 1, date: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);

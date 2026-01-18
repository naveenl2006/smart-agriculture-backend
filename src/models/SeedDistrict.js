const mongoose = require('mongoose');

const seedDistrictSchema = new mongoose.Schema({
    districtId: {
        type: Number,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    nameTamil: {
        type: String,
        trim: true,
    },
    url: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('SeedDistrict', seedDistrictSchema);

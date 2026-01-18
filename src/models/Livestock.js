const mongoose = require('mongoose');
const { LIVESTOCK_TYPES, HEALTH_RECORD_TYPES } = require('../config/constants');

const livestockSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    type: {
        type: String,
        enum: LIVESTOCK_TYPES,
        required: true,
    },
    breed: String,
    tagId: {
        type: String,
        unique: true,
        sparse: true,
    },
    name: String,
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    dateOfBirth: Date,
    weight: {
        value: Number,
        unit: { type: String, default: 'kg' },
        lastUpdated: Date,
    },
    purchaseInfo: {
        date: Date,
        price: Number,
        source: String,
    },
    parentage: {
        mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Livestock' },
        father: { type: mongoose.Schema.Types.ObjectId, ref: 'Livestock' },
    },
    productivity: {
        milkYield: { daily: Number, monthly: Number },
        eggProduction: { daily: Number, monthly: Number },
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'deceased', 'pregnant', 'lactating'],
        default: 'active',
    },
    photo: String,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const healthRecordSchema = new mongoose.Schema({
    livestock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Livestock',
        required: true,
    },
    type: {
        type: String,
        enum: HEALTH_RECORD_TYPES,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    diagnosis: String,
    symptoms: [String],
    treatment: {
        medicines: [{
            name: String,
            dosage: String,
            duration: String,
        }],
        procedures: [String],
    },
    veterinarian: {
        name: String,
        phone: String,
    },
    cost: Number,
    followUpDate: Date,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const vaccinationSchema = new mongoose.Schema({
    livestock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Livestock',
        required: true,
    },
    vaccineName: {
        type: String,
        required: true,
    },
    disease: String,
    dateAdministered: {
        type: Date,
        required: true,
    },
    nextDueDate: Date,
    batchNumber: String,
    administeredBy: String,
    cost: Number,
    notes: String,
    reminderSent: { type: Boolean, default: false },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Livestock = mongoose.model('Livestock', livestockSchema);
const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
const Vaccination = mongoose.model('Vaccination', vaccinationSchema);

module.exports = { Livestock, HealthRecord, Vaccination };

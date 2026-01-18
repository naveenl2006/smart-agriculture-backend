const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    sensorId: {
        type: String,
        required: true,
    },
    sensorType: {
        type: String,
        enum: ['soil_moisture', 'temperature', 'humidity', 'ph', 'light', 'water_level'],
        required: true,
    },
    location: {
        zone: String,
        description: String,
        coordinates: {
            latitude: Number,
            longitude: Number,
        },
    },
    value: {
        type: Number,
        required: true,
    },
    unit: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['normal', 'warning', 'critical'],
        default: 'normal',
    },
}, {
    timestamps: true,
});

const irrigationScheduleSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    zone: {
        name: String,
        area: { value: Number, unit: String },
        crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    },
    plantType: {
        type: String,
        default: 'General',
    },
    scheduleType: {
        type: String,
        enum: ['manual', 'automatic', 'sensor_based'],
        default: 'manual',
    },
    frequency: {
        type: String,
        enum: ['daily', 'alternate_days', 'weekly', 'custom'],
    },
    customDays: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday
    time: {
        start: String, // HH:MM format
        duration: Number, // minutes
    },
    waterLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'custom'],
        default: 'medium',
    },
    waterAmount: {
        value: Number,
        unit: { type: String, default: 'liters' },
    },
    thresholds: {
        soilMoisture: { min: Number, max: Number },
        temperature: { min: Number, max: Number },
    },
    isActive: { type: Boolean, default: true },
    lastRun: Date,
    nextRun: Date,
    history: [{
        date: Date,
        duration: Number,
        waterUsed: Number,
        trigger: { type: String, enum: ['scheduled', 'manual', 'sensor'] },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});


// Index for efficient time-series queries
sensorDataSchema.index({ sensorId: 1, timestamp: -1 });
sensorDataSchema.index({ farmer: 1, sensorType: 1, timestamp: -1 });

// IoT Device Schema for device registration and management
const iotDeviceSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
    },
    deviceName: {
        type: String,
        required: true,
    },
    deviceType: {
        type: String,
        enum: ['esp32', 'esp8266', 'arduino', 'raspberry_pi', 'other'],
        default: 'esp32',
    },
    apiKey: {
        type: String,
        required: true,
        unique: true,
    },
    sensors: [{
        sensorId: String,
        sensorType: {
            type: String,
            enum: ['soil_moisture', 'temperature', 'humidity', 'ph', 'light', 'water_level', 'water_flow', 'rain'],
        },
        name: String,
        unit: String,
        zone: String,
    }],
    location: {
        zone: String,
        description: String,
        coordinates: {
            latitude: Number,
            longitude: Number,
        },
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    lastSeen: Date,
    lastData: {
        type: Map,
        of: Number,
    },
    settings: {
        reportInterval: { type: Number, default: 60 }, // seconds
        alertsEnabled: { type: Boolean, default: true },
    },
    thresholds: {
        soil_moisture: { min: { type: Number, default: 30 }, max: { type: Number, default: 80 } },
        temperature: { min: { type: Number, default: 15 }, max: { type: Number, default: 40 } },
        humidity: { min: { type: Number, default: 40 }, max: { type: Number, default: 90 } },
        ph: { min: { type: Number, default: 5.5 }, max: { type: Number, default: 7.5 } },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for device lookup
iotDeviceSchema.index({ apiKey: 1 });
iotDeviceSchema.index({ farmer: 1, isOnline: 1 });

const SensorData = mongoose.model('SensorData', sensorDataSchema);
const IrrigationSchedule = mongoose.model('IrrigationSchedule', irrigationScheduleSchema);
const IoTDevice = mongoose.model('IoTDevice', iotDeviceSchema);

module.exports = { SensorData, IrrigationSchedule, IoTDevice };

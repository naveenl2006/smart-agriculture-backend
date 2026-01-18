const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middlewares/auth');
const { SensorData, IoTDevice } = require('../models/Irrigation');
const Farmer = require('../models/Farmer');

// Generate unique API key for IoT device
const generateApiKey = () => {
    return 'iot_' + crypto.randomBytes(24).toString('hex');
};

// Generate unique device ID
const generateDeviceId = () => {
    return 'DEV_' + crypto.randomBytes(8).toString('hex').toUpperCase();
};

// ==================== PROTECTED ROUTES (User Dashboard) ====================

// @desc    Get all registered IoT devices for user
// @route   GET /api/iot/devices
// @access  Private
router.get('/devices', protect, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const devices = await IoTDevice.find({ farmer: farmer._id })
            .select('-apiKey')
            .sort({ createdAt: -1 });

        // Check online status (device is online if last seen within 2x report interval)
        const devicesWithStatus = devices.map(device => {
            const d = device.toObject();
            const interval = (device.settings?.reportInterval || 60) * 2 * 1000;
            d.isOnline = device.lastSeen && (Date.now() - device.lastSeen.getTime()) < interval;
            return d;
        });

        res.json({ success: true, data: devicesWithStatus });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch devices' });
    }
});

// @desc    Register a new IoT device
// @route   POST /api/iot/devices
// @access  Private
router.post('/devices', protect, async (req, res) => {
    try {
        const { deviceName, deviceType, sensors, location } = req.body;

        let farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            // Create farmer profile if doesn't exist
            farmer = await Farmer.create({ user: req.user.id });
        }

        const device = await IoTDevice.create({
            farmer: farmer._id,
            user: req.user.id,
            deviceId: generateDeviceId(),
            deviceName,
            deviceType: deviceType || 'esp32',
            apiKey: generateApiKey(),
            sensors: sensors || [],
            location: location || {},
        });

        res.status(201).json({
            success: true,
            message: 'Device registered successfully',
            data: {
                deviceId: device.deviceId,
                deviceName: device.deviceName,
                apiKey: device.apiKey, // Only returned once during registration
                sensors: device.sensors,
            },
        });
    } catch (error) {
        console.error('Register device error:', error);
        res.status(500).json({ success: false, message: 'Failed to register device' });
    }
});

// @desc    Update IoT device settings
// @route   PUT /api/iot/devices/:deviceId
// @access  Private
router.put('/devices/:deviceId', protect, async (req, res) => {
    try {
        const { deviceName, sensors, location, settings, thresholds } = req.body;

        const device = await IoTDevice.findOneAndUpdate(
            { deviceId: req.params.deviceId, user: req.user.id },
            { deviceName, sensors, location, settings, thresholds },
            { new: true }
        ).select('-apiKey');

        if (!device) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        res.json({ success: true, data: device });
    } catch (error) {
        console.error('Update device error:', error);
        res.status(500).json({ success: false, message: 'Failed to update device' });
    }
});

// @desc    Regenerate API key for device
// @route   POST /api/iot/devices/:deviceId/regenerate-key
// @access  Private
router.post('/devices/:deviceId/regenerate-key', protect, async (req, res) => {
    try {
        const newApiKey = generateApiKey();

        const device = await IoTDevice.findOneAndUpdate(
            { deviceId: req.params.deviceId, user: req.user.id },
            { apiKey: newApiKey },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        res.json({
            success: true,
            message: 'API key regenerated',
            data: { apiKey: newApiKey },
        });
    } catch (error) {
        console.error('Regenerate key error:', error);
        res.status(500).json({ success: false, message: 'Failed to regenerate key' });
    }
});

// @desc    Delete IoT device
// @route   DELETE /api/iot/devices/:deviceId
// @access  Private
router.delete('/devices/:deviceId', protect, async (req, res) => {
    try {
        const device = await IoTDevice.findOneAndDelete({
            deviceId: req.params.deviceId,
            user: req.user.id,
        });

        if (!device) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        // Optionally delete sensor data for this device
        await SensorData.deleteMany({ sensorId: { $regex: `^${device.deviceId}` } });

        res.json({ success: true, message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Delete device error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete device' });
    }
});

// @desc    Get real-time sensor data from all user devices
// @route   GET /api/iot/sensors/realtime
// @access  Private
router.get('/sensors/realtime', protect, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: { devices: [], sensors: [] } });
        }

        const devices = await IoTDevice.find({ farmer: farmer._id });

        // Get latest reading for each sensor
        const sensorData = [];
        for (const device of devices) {
            const interval = (device.settings?.reportInterval || 60) * 2 * 1000;
            const isOnline = device.lastSeen && (Date.now() - device.lastSeen.getTime()) < interval;

            for (const sensor of device.sensors || []) {
                const latestReading = await SensorData.findOne({
                    sensorId: `${device.deviceId}_${sensor.sensorId}`,
                }).sort({ timestamp: -1 });

                sensorData.push({
                    deviceId: device.deviceId,
                    deviceName: device.deviceName,
                    isOnline,
                    sensorId: sensor.sensorId,
                    sensorType: sensor.sensorType,
                    name: sensor.name,
                    unit: sensor.unit || getDefaultUnit(sensor.sensorType),
                    zone: sensor.zone || device.location?.zone,
                    value: latestReading?.value || null,
                    status: latestReading?.status || 'unknown',
                    lastUpdated: latestReading?.timestamp || null,
                    thresholds: device.thresholds?.[sensor.sensorType],
                });
            }
        }

        res.json({
            success: true,
            data: {
                sensors: sensorData,
                lastUpdated: new Date(),
            },
        });
    } catch (error) {
        console.error('Get realtime sensors error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sensor data' });
    }
});

// ==================== PUBLIC IoT ENDPOINTS (API Key Auth) ====================

// @desc    Push sensor data from IoT device
// @route   POST /api/iot/data
// @access  IoT Device (API Key)
router.post('/data', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.body.apiKey;

        if (!apiKey) {
            return res.status(401).json({ success: false, message: 'API key required' });
        }

        const device = await IoTDevice.findOne({ apiKey });
        if (!device) {
            return res.status(401).json({ success: false, message: 'Invalid API key' });
        }

        const { sensors: sensorReadings } = req.body;

        if (!sensorReadings || !Array.isArray(sensorReadings)) {
            return res.status(400).json({ success: false, message: 'Sensors array required' });
        }

        // Store each sensor reading
        const storedData = [];
        const lastData = new Map();

        for (const reading of sensorReadings) {
            const { sensorId, sensorType, value, unit } = reading;

            if (!sensorId || value === undefined) continue;

            // Determine status based on thresholds
            const thresholds = device.thresholds?.[sensorType];
            let status = 'normal';
            if (thresholds) {
                if (value < thresholds.min || value > thresholds.max) {
                    status = 'critical';
                } else if (value < thresholds.min * 1.1 || value > thresholds.max * 0.9) {
                    status = 'warning';
                }
            }

            const sensorData = await SensorData.create({
                farmer: device.farmer,
                sensorId: `${device.deviceId}_${sensorId}`,
                sensorType: sensorType || 'soil_moisture',
                value,
                unit: unit || getDefaultUnit(sensorType),
                status,
                location: device.location,
            });

            storedData.push(sensorData);
            lastData.set(sensorType, value);
        }

        // Update device last seen and last data
        device.lastSeen = new Date();
        device.isOnline = true;
        device.lastData = lastData;
        await device.save();

        res.json({
            success: true,
            message: `Received ${storedData.length} sensor readings`,
            data: {
                deviceId: device.deviceId,
                readings: storedData.length,
                timestamp: new Date(),
            },
        });
    } catch (error) {
        console.error('Push sensor data error:', error);
        res.status(500).json({ success: false, message: 'Failed to store sensor data' });
    }
});

// @desc    Get device config/settings (for IoT device to fetch)
// @route   GET /api/iot/config
// @access  IoT Device (API Key)
router.get('/config', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;

        if (!apiKey) {
            return res.status(401).json({ success: false, message: 'API key required' });
        }

        const device = await IoTDevice.findOne({ apiKey });
        if (!device) {
            return res.status(401).json({ success: false, message: 'Invalid API key' });
        }

        res.json({
            success: true,
            data: {
                deviceId: device.deviceId,
                sensors: device.sensors,
                settings: device.settings,
                thresholds: device.thresholds,
            },
        });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch config' });
    }
});

// @desc    Heartbeat/ping from IoT device
// @route   POST /api/iot/heartbeat
// @access  IoT Device (API Key)
router.post('/heartbeat', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.body.apiKey;

        if (!apiKey) {
            return res.status(401).json({ success: false, message: 'API key required' });
        }

        const device = await IoTDevice.findOneAndUpdate(
            { apiKey },
            { lastSeen: new Date(), isOnline: true },
            { new: true }
        );

        if (!device) {
            return res.status(401).json({ success: false, message: 'Invalid API key' });
        }

        res.json({
            success: true,
            data: {
                deviceId: device.deviceId,
                serverTime: new Date(),
                settings: device.settings,
            },
        });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ success: false, message: 'Heartbeat failed' });
    }
});

// Helper function to get default unit for sensor type
function getDefaultUnit(sensorType) {
    const units = {
        soil_moisture: '%',
        temperature: '°C',
        humidity: '%',
        ph: 'pH',
        light: 'lux',
        water_level: 'cm',
        water_flow: 'L/min',
        rain: 'mm',
    };
    return units[sensorType] || '';
}

module.exports = router;

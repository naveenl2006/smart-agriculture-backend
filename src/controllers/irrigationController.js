const { SensorData, IrrigationSchedule } = require('../models/Irrigation');
const Farmer = require('../models/Farmer');

// @desc    Get sensor dashboard data
// @route   GET /api/irrigation/sensors
// @access  Private
const getSensorData = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer profile not found' });
        }

        // Get latest sensor readings
        const latestReadings = await SensorData.aggregate([
            { $match: { farmer: farmer._id } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$sensorType',
                    latest: { $first: '$$ROOT' },
                }
            },
        ]);

        // If no real data, return simulated sensor data
        let sensorData = latestReadings.map(r => r.latest);
        if (sensorData.length === 0) {
            sensorData = [
                { sensorType: 'soil_moisture', value: 45 + Math.random() * 20, unit: '%', status: 'normal' },
                { sensorType: 'temperature', value: 25 + Math.random() * 10, unit: '°C', status: 'normal' },
                { sensorType: 'humidity', value: 60 + Math.random() * 20, unit: '%', status: 'normal' },
                { sensorType: 'ph', value: 6 + Math.random() * 1.5, unit: 'pH', status: 'normal' },
            ];
        }

        res.json({
            success: true,
            data: {
                sensors: sensorData,
                lastUpdated: new Date(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sensor history
// @route   GET /api/irrigation/sensors/history
// @access  Private
const getSensorHistory = async (req, res, next) => {
    try {
        const { type = 'soil_moisture', hours = 24 } = req.query;
        const farmer = await Farmer.findOne({ user: req.user.id });

        const startTime = new Date();
        startTime.setHours(startTime.getHours() - parseInt(hours));

        let history = await SensorData.find({
            farmer: farmer?._id,
            sensorType: type,
            timestamp: { $gte: startTime },
        }).sort({ timestamp: 1 });

        // Generate mock data if no history
        if (history.length === 0) {
            history = [];
            let baseValue = type === 'soil_moisture' ? 50 : type === 'temperature' ? 28 : 65;
            for (let i = parseInt(hours); i >= 0; i--) {
                const timestamp = new Date();
                timestamp.setHours(timestamp.getHours() - i);
                baseValue = baseValue * (0.98 + Math.random() * 0.04);
                history.push({
                    sensorType: type,
                    value: Math.round(baseValue * 10) / 10,
                    timestamp,
                });
            }
        }

        res.json({
            success: true,
            data: { type, hours: parseInt(hours), history },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get irrigation schedules
// @route   GET /api/irrigation/schedules
// @access  Private
const getSchedules = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const schedules = await IrrigationSchedule.find({ farmer: farmer._id })
            .populate('zone.crop', 'name')
            .sort({ 'time.start': 1 });

        res.json({ success: true, data: schedules });
    } catch (error) {
        next(error);
    }
};

// @desc    Create irrigation schedule
// @route   POST /api/irrigation/schedules
// @access  Private
const createSchedule = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer profile not found' });
        }

        const schedule = await IrrigationSchedule.create({
            farmer: farmer._id,
            ...req.body,
        });

        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Update irrigation schedule
// @route   PUT /api/irrigation/schedules/:id
// @access  Private
const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await IrrigationSchedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }

        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete irrigation schedule
// @route   DELETE /api/irrigation/schedules/:id
// @access  Private
const deleteSchedule = async (req, res, next) => {
    try {
        const schedule = await IrrigationSchedule.findByIdAndDelete(req.params.id);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        res.json({ success: true, message: 'Schedule deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get water usage analytics
// @route   GET /api/irrigation/analytics
// @access  Private
const getWaterUsageAnalytics = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const farmer = await Farmer.findOne({ user: req.user.id });

        // Mock analytics data
        const analytics = {
            totalWaterUsed: Math.round(Math.random() * 50000 + 10000),
            averageDaily: Math.round(Math.random() * 1500 + 500),
            savedComparedToManual: Math.round(Math.random() * 30 + 10),
            byZone: [
                { zone: 'Zone A', usage: Math.round(Math.random() * 15000 + 5000), unit: 'liters' },
                { zone: 'Zone B', usage: Math.round(Math.random() * 12000 + 4000), unit: 'liters' },
                { zone: 'Zone C', usage: Math.round(Math.random() * 8000 + 3000), unit: 'liters' },
            ],
            dailyUsage: [],
        };

        // Generate daily usage for chart
        for (let i = parseInt(days); i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            analytics.dailyUsage.push({
                date,
                usage: Math.round(Math.random() * 1000 + 500),
            });
        }

        res.json({ success: true, data: analytics });
    } catch (error) {
        next(error);
    }
};

// @desc    Trigger manual irrigation
// @route   POST /api/irrigation/trigger
// @access  Private
const triggerIrrigation = async (req, res, next) => {
    try {
        const { zone, duration } = req.body;

        // Simulate triggering irrigation
        res.json({
            success: true,
            message: `Irrigation started for ${zone} for ${duration} minutes`,
            data: {
                zone,
                duration,
                startedAt: new Date(),
                estimatedEnd: new Date(Date.now() + duration * 60000),
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSensorData,
    getSensorHistory,
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getWaterUsageAnalytics,
    triggerIrrigation,
};

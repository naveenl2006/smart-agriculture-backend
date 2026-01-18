const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getSensorData,
    getSensorHistory,
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getWaterUsageAnalytics,
    triggerIrrigation,
} = require('../controllers/irrigationController');

// All routes are protected
router.use(protect);

// Sensor routes
router.get('/sensors', getSensorData);
router.get('/sensors/history', getSensorHistory);

// Schedule routes
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.put('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Analytics and control
router.get('/analytics', getWaterUsageAnalytics);
router.post('/trigger', triggerIrrigation);

module.exports = router;

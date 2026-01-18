const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getWeatherData,
    getWeatherForecast,
    getWeatherAlerts,
    markAlertAsRead,
    refreshAlerts,
    markAllAsRead
} = require('../controllers/weatherController');

// All routes require authentication
router.use(protect);

// Weather data routes
router.get('/', getWeatherData);
router.get('/forecast', getWeatherForecast);

// Alert routes
router.get('/alerts', getWeatherAlerts);
router.patch('/alerts/:id/read', markAlertAsRead);
router.post('/alerts/refresh', refreshAlerts);
router.post('/alerts/read-all', markAllAsRead);

module.exports = router;

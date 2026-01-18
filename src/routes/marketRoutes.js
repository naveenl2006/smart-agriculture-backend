const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getTodayPrices,
    getPriceHistory,
    getBestMarket,
    getPriceAlerts,
    refreshPrices,
} = require('../controllers/marketController');

// Public routes
router.get('/today', getTodayPrices);
router.get('/history/:commodity', getPriceHistory);
router.get('/best/:commodity', getBestMarket);
router.post('/refresh', refreshPrices);

// Protected routes
router.get('/alerts', protect, getPriceAlerts);

module.exports = router;

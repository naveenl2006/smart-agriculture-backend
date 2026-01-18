const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    calculateFarmSetup,
    saveFarmSetup,
    getFarmSetupHistory,
    getFarmSetupById,
} = require('../controllers/farmSetupController');

// All routes require authentication
router.use(protect);

// Calculate farm setup (no saving)
router.post('/calculate', calculateFarmSetup);

// Save farm setup
router.post('/', saveFarmSetup);

// Get history
router.get('/history', getFarmSetupHistory);

// Get by ID
router.get('/:id', getFarmSetupById);

module.exports = router;

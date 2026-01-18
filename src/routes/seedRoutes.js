const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getDistricts,
    getSeedsByDistrict,
    refreshSeedData,
    getDistrictById,
} = require('../controllers/seedController');

// Public routes
router.get('/districts', getDistricts);
router.get('/districts/:id', getDistrictById);
router.get('/', getSeedsByDistrict);

// Protected routes
router.post('/refresh', protect, refreshSeedData);

module.exports = router;

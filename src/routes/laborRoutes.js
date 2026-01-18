const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getLaborers,
    getLaborerById,
    getLaborRecommendations,
    registerLaborer,
    registerAsLaborer,
    updateLaborerProfile,
    hireLaborer,
    getHiringHistory,
    updateHiringStatus,
} = require('../controllers/laborController');

// Public routes
router.get('/', getLaborers);
router.post('/public-register', registerLaborer);
router.post('/recommend', protect, getLaborRecommendations);
router.get('/hiring', protect, getHiringHistory);
router.get('/:id', getLaborerById);

// Protected routes
router.post('/register', protect, registerAsLaborer);
router.put('/profile', protect, updateLaborerProfile);
router.post('/:id/hire', protect, hireLaborer);
router.put('/hiring/:id', protect, updateHiringStatus);

module.exports = router;

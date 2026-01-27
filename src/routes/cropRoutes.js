const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleCheck');
const {
    getCrops,
    getCropById,
    getRecommendations,
    getRecommendationHistory,
    createCrop,
    updateCrop,
    getNDVIRecommendations,
    getNDVIDistricts,
} = require('../controllers/cropController');

// Public routes
router.get('/', getCrops);
router.get('/ndvi-districts', getNDVIDistricts);
router.get('/:id', getCropById);

// Protected routes
router.post('/recommend', protect, getRecommendations);
router.post('/ndvi-recommend', protect, getNDVIRecommendations);
router.get('/recommendations/history', protect, getRecommendationHistory);

// Admin routes
router.post('/', protect, authorize('admin'), createCrop);
router.put('/:id', protect, authorize('admin'), updateCrop);

module.exports = router;


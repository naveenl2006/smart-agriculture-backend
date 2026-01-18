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
} = require('../controllers/cropController');

// Public routes
router.get('/', getCrops);
router.get('/:id', getCropById);

// Protected routes
router.post('/recommend', protect, getRecommendations);
router.get('/recommendations/history', protect, getRecommendationHistory);

// Admin routes
router.post('/', protect, authorize('admin'), createCrop);
router.put('/:id', protect, authorize('admin'), updateCrop);

module.exports = router;

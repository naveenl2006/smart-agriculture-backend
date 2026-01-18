const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');
const { aiLimiter } = require('../middlewares/rateLimiter');
const {
    detectDisease,
    getDetectionHistory,
    getDiseases,
    getDiseaseById,
    submitFeedback,
} = require('../controllers/diseaseController');

// Disease detection with image upload
router.post('/detect', aiLimiter, uploadSingle('diseaseImage'), detectDisease);

// Detection history (protected)
router.get('/history', protect, getDetectionHistory);

// Disease library
router.get('/', getDiseases);
router.get('/:id', getDiseaseById);

// Feedback (protected)
router.post('/feedback/:id', protect, submitFeedback);

module.exports = router;

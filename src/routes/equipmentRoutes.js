const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');
const {
    getEquipment,
    getEquipmentById,
    getRecommendedEquipment,
    createEquipment,
    updateEquipment,
    bookEquipment,
    getBookingHistory,
    updateBookingStatus,
    addReview,
} = require('../controllers/equipmentController');

// Public routes
router.get('/', getEquipment);
router.post('/recommend', protect, getRecommendedEquipment);
router.get('/bookings', protect, getBookingHistory);
router.get('/:id', getEquipmentById);

// Protected routes
router.post('/', protect, uploadMultiple('equipmentImage', 5), createEquipment);
router.put('/:id', protect, updateEquipment);
router.post('/:id/book', protect, bookEquipment);

// Booking management
router.put('/bookings/:id', protect, updateBookingStatus);
router.post('/bookings/:id/review', protect, addReview);

module.exports = router;

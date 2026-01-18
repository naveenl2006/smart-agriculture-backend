const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');
const {
    registerVehicle,
    getVehicles,
    getVehicleById,
} = require('../controllers/vehicleController');

// Public routes
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Protected routes - require authentication
router.post('/', protect, uploadSingle('vehicleImage'), registerVehicle);

module.exports = router;

const { Vehicle } = require('../models/Vehicle');
const path = require('path');

// @desc    Register a new vehicle
// @route   POST /api/vehicles
// @access  Private
const registerVehicle = async (req, res, next) => {
    try {
        const { ownerName, location, vehicleType, vehicleNumber, phoneNumber, perHourRent } = req.body;

        // Check if image was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle image is required',
            });
        }

        // Validate required fields
        if (!ownerName || !location || !vehicleType || !vehicleNumber || !phoneNumber || !perHourRent) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: ownerName, location, vehicleType, vehicleNumber, phoneNumber, perHourRent',
            });
        }

        // Validate phone number format
        if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number',
            });
        }

        // Check for duplicate vehicle number
        const existingVehicle = await Vehicle.findOne({
            vehicleNumber: vehicleNumber.toUpperCase()
        });

        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'A vehicle with this number is already registered',
            });
        }

        // Create vehicle with image path
        const imagePath = `/uploads/vehicles/${req.file.filename}`;

        const vehicle = await Vehicle.create({
            ownerName: ownerName.trim(),
            location: location.trim(),
            vehicleType: vehicleType.toLowerCase(),
            vehicleNumber: vehicleNumber.toUpperCase(),
            phoneNumber: phoneNumber.trim(),
            perHourRent: Number(perHourRent),
            imagePath,
        });

        res.status(201).json({
            success: true,
            message: 'Vehicle registered successfully',
            data: vehicle,
        });
    } catch (error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A vehicle with this number is already registered',
            });
        }
        next(error);
    }
};

// @desc    Get all registered vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res, next) => {
    try {
        const { city, type } = req.query;
        const query = {};

        // Filter by city/location if provided
        if (city) {
            query.location = { $regex: new RegExp(`^${city}$`, 'i') };
        }

        // Filter by vehicle type if provided
        if (type) {
            query.vehicleType = type.toLowerCase();
        }

        const vehicles = await Vehicle.find(query)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: vehicles,
            count: vehicles.length,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found',
            });
        }

        res.json({
            success: true,
            data: vehicle,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerVehicle,
    getVehicles,
    getVehicleById,
};

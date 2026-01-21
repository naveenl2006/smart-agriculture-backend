const { Vehicle } = require('../models/Vehicle');
const path = require('path');

// @desc    Register a new vehicle
// @route   POST /api/vehicles
// @access  Private
const registerVehicle = async (req, res, next) => {
    try {
        const {
            ownerName,
            name,
            location,
            latitude,
            longitude,
            vehicleType,
            vehicleNumber,
            phoneNumber,
            perHourRent,
            pricePerDay,
            availabilityStatus
        } = req.body;

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

        // Validate GPS coordinates
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'GPS coordinates (latitude and longitude) are required',
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({
                success: false,
                message: 'Invalid latitude. Must be between -90 and 90',
            });
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid longitude. Must be between -180 and 180',
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
            name: name?.trim() || `${ownerName}'s ${vehicleType}`,
            location: location.trim(),
            latitude: lat,
            longitude: lng,
            vehicleType: vehicleType.toLowerCase(),
            vehicleNumber: vehicleNumber.toUpperCase(),
            phoneNumber: phoneNumber.trim(),
            perHourRent: Number(perHourRent),
            pricePerDay: pricePerDay ? Number(pricePerDay) : Number(perHourRent) * 8,
            availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true,
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

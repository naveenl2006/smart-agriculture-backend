const Disease = require('../models/Disease');
const DiseaseDetection = require('../models/DiseaseDetection');
const Farmer = require('../models/Farmer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

// Helper function to parse disease name from AI model format
const parseDiseaseClass = (classString) => {
    // Format: "Plant___Disease_name" e.g., "Tomato___Early_blight"
    if (!classString) return { plant: 'Unknown', disease: 'Unknown', isHealthy: false };

    const parts = classString.split('___');
    const plant = parts[0]?.replace(/_/g, ' ') || 'Unknown';
    const diseaseRaw = parts[1] || '';
    const isHealthy = diseaseRaw.toLowerCase() === 'healthy';
    const disease = isHealthy ? 'Healthy' : diseaseRaw.replace(/_/g, ' ');

    return { plant, disease, isHealthy, fullName: `${plant}: ${disease}` };
};

// @desc    Detect disease from image
// @route   POST /api/diseases/detect
// @access  Public (with optional auth)
const detectDisease = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image',
            });
        }

        const imageUrl = `/uploads/diseases/${req.file.filename}`;

        let prediction;
        let aiResponse;
        try {
            // Create FormData and read the saved file from disk
            const formData = new FormData();
            const filePath = req.file.path;
            formData.append('image', fs.createReadStream(filePath), {
                filename: req.file.originalname || 'image.jpg',
                contentType: req.file.mimetype || 'image/jpeg',
            });

            // Call AI model API
            aiResponse = await axios.post(`${env.aiModelUrl}/predict`, formData, {
                headers: formData.getHeaders(),
                timeout: 30000,
            });


            const aiData = aiResponse.data;

            // The Flask API already returns data in the correct format
            prediction = {
                diseaseName: aiData.diseaseName,
                confidence: aiData.confidence, // Already in percentage from Flask
                isHealthy: aiData.isHealthy,
                alternativePredictions: aiData.alternativePredictions || [],
            };
        } catch (aiError) {
            console.error('AI Model Error:', aiError.message);
            // Fallback mock prediction if AI model is unavailable
            prediction = {
                diseaseName: 'AI Model Unavailable',
                confidence: 0,
                isHealthy: false,
                alternativePredictions: [],
                error: 'Could not connect to AI model. Please ensure the model is running.',
            };
        }

        // Get farmer if authenticated
        let farmer = null;
        if (req.user) {
            farmer = await Farmer.findOne({ user: req.user.id });
        }

        // Save detection record - only store AI prediction, no static treatments
        const detection = await DiseaseDetection.create({
            farmer: farmer?._id,
            imageUrl,
            originalFilename: req.file.originalname,
            cropType: req.body.cropType,
            prediction: {
                diseaseName: prediction.diseaseName,
                confidence: prediction.confidence,
                isHealthy: prediction.isHealthy,
                alternativePredictions: prediction.alternativePredictions,
            },
            location: req.body.location,
        });

        res.json({
            success: true,
            data: {
                id: detection._id,
                imageUrl,
                prediction: detection.prediction,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get detection history
// @route   GET /api/diseases/history
// @access  Private
const getDetectionHistory = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const history = await DiseaseDetection.find({ farmer: farmer._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all diseases
// @route   GET /api/diseases
// @access  Public
const getDiseases = async (req, res, next) => {
    try {
        const { type, crop, search } = req.query;
        const query = {};

        if (type) query.type = type;
        if (crop) query.affectedCrops = crop;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { symptoms: { $regex: search, $options: 'i' } },
            ];
        }

        const diseases = await Disease.find(query)
            .populate('affectedCrops', 'name')
            .sort({ name: 1 });

        res.json({ success: true, data: diseases });
    } catch (error) {
        next(error);
    }
};

// @desc    Get disease by ID
// @route   GET /api/diseases/:id
// @access  Public
const getDiseaseById = async (req, res, next) => {
    try {
        const disease = await Disease.findById(req.params.id)
            .populate('affectedCrops', 'name imageUrl');

        if (!disease) {
            return res.status(404).json({ success: false, message: 'Disease not found' });
        }

        res.json({ success: true, data: disease });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit feedback on detection
// @route   POST /api/diseases/feedback/:id
// @access  Private
const submitFeedback = async (req, res, next) => {
    try {
        const { isCorrect, actualDisease, comments } = req.body;

        const detection = await DiseaseDetection.findByIdAndUpdate(
            req.params.id,
            {
                feedback: { isCorrect, actualDisease, comments },
            },
            { new: true }
        );

        if (!detection) {
            return res.status(404).json({ success: false, message: 'Detection not found' });
        }

        res.json({ success: true, message: 'Feedback submitted', data: detection });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    detectDisease,
    getDetectionHistory,
    getDiseases,
    getDiseaseById,
    submitFeedback,
};

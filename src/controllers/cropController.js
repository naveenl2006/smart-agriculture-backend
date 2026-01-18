const Crop = require('../models/Crop');
const CropRecommendation = require('../models/CropRecommendation');
const Farmer = require('../models/Farmer');
const { PAGINATION } = require('../config/constants');

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
const getCrops = async (req, res, next) => {
    try {
        const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, category, season, soilType } = req.query;

        const query = {};
        if (category) query.category = category;
        if (season) query.seasons = season;
        if (soilType) query.suitableSoilTypes = soilType;

        const crops = await Crop.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        const total = await Crop.countDocuments(query);

        res.json({
            success: true,
            data: {
                crops,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get crop by ID
// @route   GET /api/crops/:id
// @access  Public
const getCropById = async (req, res, next) => {
    try {
        const crop = await Crop.findById(req.params.id);
        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found',
            });
        }
        res.json({ success: true, data: crop });
    } catch (error) {
        next(error);
    }
};

// @desc    Get crop recommendations
// @route   POST /api/crops/recommend
// @access  Private
const getRecommendations = async (req, res, next) => {
    try {
        const { landSize, soilType, waterAvailability, season, state, district } = req.body;

        // Find suitable crops based on input criteria
        const query = {};
        if (soilType) query.suitableSoilTypes = soilType;
        if (waterAvailability) query.waterRequirement = waterAvailability;
        if (season) query.seasons = season;

        const suitableCrops = await Crop.find(query).limit(10);

        // Calculate recommendations with scores
        // Calculate recommendations with scores
        const recommendations = suitableCrops.map(crop => {
            // weighted scoring system
            let score = 0;
            let matchDetails = [];

            // 1. Soil Match (Weight: 40%)
            if (crop.suitableSoilTypes?.includes(soilType?.toLowerCase())) {
                score += 40;
                matchDetails.push('Perfect soil match');
            } else if (!soilType) {
                score += 20; // Neutral if no soil specified
            }

            // 2. Season Match (Weight: 35%)
            if (crop.seasons?.includes(season?.toLowerCase())) {
                score += 35;
                matchDetails.push('Suitable for current season');
            } else {
                // partial credit if it grows year-round or has multiple seasons
                if (crop.seasons?.includes('all') || crop.seasons?.length > 2) {
                    score += 15;
                    matchDetails.push('Adaptable to season');
                }
            }

            // 3. Water Availability Match (Weight: 25%)
            const waterMap = { 'low': 1, 'medium': 2, 'high': 3 };
            const cropWater = waterMap[crop.waterRequirement] || 2; // default medium
            const farmWater = waterMap[waterAvailability] || 2;

            if (cropWater <= farmWater) {
                score += 25;
                matchDetails.push('Sufficient water available');
            } else {
                score += 10;
                matchDetails.push('Requires efficient irrigation');
            }

            // Normalize score to 60-98 range for better UX (avoid 0s or 100s)
            // If it matched query (which it did to be in suitableCrops), it's at least decent
            let finalScore = Math.max(60, Math.min(98, score));

            const expectedYield = {
                value: (crop.avgYield?.value || 500) * (landSize?.value || 1),
                unit: crop.avgYield?.unit || 'kg',
            };

            const estimatedRevenue = expectedYield.value * (crop.marketPrice?.modal || 50);
            const estimatedCost = expectedYield.value * 15; // Rough estimate based on yield

            return {
                crop: crop._id,
                cropName: crop.name,
                score: finalScore,
                matchDetails,
                expectedYield,
                waterNeeded: { value: landSize?.value * 5000, unit: 'liters' }, // simplified calc
                fertilizerNeeded: crop.fertilizers || [],
                estimatedCost,
                estimatedRevenue,
                estimatedProfit: estimatedRevenue - estimatedCost,
                growingPeriod: crop.growingPeriod?.max || 120,
                riskLevel: finalScore > 85 ? 'low' : finalScore > 70 ? 'medium' : 'high',
            };
        });

        // Sort by score
        recommendations.sort((a, b) => b.score - a.score);

        // Get farmer profile
        const farmer = await Farmer.findOne({ user: req.user.id });

        // Save recommendation history
        const recommendation = await CropRecommendation.create({
            farmer: farmer?._id,
            inputData: { landSize, soilType, waterAvailability, season, state, district },
            recommendations,
        });

        res.json({
            success: true,
            data: {
                id: recommendation._id,
                recommendations,
                inputData: { landSize, soilType, waterAvailability, season, state, district },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get recommendation history
// @route   GET /api/crops/recommendations/history
// @access  Private
const getRecommendationHistory = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const history = await CropRecommendation.find({ farmer: farmer._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('recommendations.crop', 'name imageUrl');

        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

// @desc    Create crop (Admin)
// @route   POST /api/crops
// @access  Private/Admin
const createCrop = async (req, res, next) => {
    try {
        const crop = await Crop.create(req.body);
        res.status(201).json({ success: true, data: crop });
    } catch (error) {
        next(error);
    }
};

// @desc    Update crop (Admin)
// @route   PUT /api/crops/:id
// @access  Private/Admin
const updateCrop = async (req, res, next) => {
    try {
        const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!crop) {
            return res.status(404).json({ success: false, message: 'Crop not found' });
        }
        res.json({ success: true, data: crop });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCrops,
    getCropById,
    getRecommendations,
    getRecommendationHistory,
    createCrop,
    updateCrop,
};

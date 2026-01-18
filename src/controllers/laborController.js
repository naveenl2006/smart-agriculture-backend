const { Labor, LaborHiring } = require('../models/Labor');
const Farmer = require('../models/Farmer');
const { PAGINATION } = require('../config/constants');

// @desc    Get all laborers
// @route   GET /api/labor
// @access  Public
const getLaborers = async (req, res, next) => {
    try {
        const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, skill, state, available } = req.query;
        const query = {};

        if (skill) query['skills.skill'] = { $regex: skill, $options: 'i' };
        if (state) query['location.state'] = state;
        if (available === 'true') query['availability.isAvailable'] = true;

        const laborers = await Labor.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ 'rating.average': -1 });

        const total = await Labor.countDocuments(query);

        res.json({
            success: true,
            data: {
                laborers,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get laborer by ID
// @route   GET /api/labor/:id
// @access  Public
const getLaborerById = async (req, res, next) => {
    try {
        const laborer = await Labor.findById(req.params.id);
        if (!laborer) {
            return res.status(404).json({ success: false, message: 'Laborer not found' });
        }
        res.json({ success: true, data: laborer });
    } catch (error) {
        next(error);
    }
};

// @desc    Register as laborer (public)
// @route   POST /api/labor/public-register
// @access  Public
const registerLaborer = async (req, res, next) => {
    try {
        const { name, phone, skills, location, dailyWage } = req.body;

        // Validate required fields
        if (!name || !phone || !skills || !location || !dailyWage) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, phone, skills, location, dailyWage',
            });
        }

        // Validate phone number format
        if (!/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number',
            });
        }

        // Parse skills array
        const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        const formattedSkills = skillsArray.map(skill => ({
            skill: skill,
            level: 'skilled',
        }));

        const laborer = await Labor.create({
            name: name.trim(),
            phone: phone.trim(),
            skills: formattedSkills,
            location: {
                district: location.trim(),
            },
            wages: {
                daily: Number(dailyWage),
            },
            availability: {
                isAvailable: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Laborer registered successfully',
            data: laborer,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register as laborer
// @route   POST /api/labor/register
// @access  Private
const registerAsLaborer = async (req, res, next) => {
    try {
        const existingLaborer = await Labor.findOne({ user: req.user.id });
        if (existingLaborer) {
            return res.status(400).json({ success: false, message: 'Already registered as laborer' });
        }

        const laborer = await Labor.create({
            user: req.user.id,
            name: req.user.name,
            phone: req.user.phone || req.body.phone,
            ...req.body,
        });

        res.status(201).json({ success: true, data: laborer });
    } catch (error) {
        next(error);
    }
};

// @desc    Update laborer profile
// @route   PUT /api/labor/profile
// @access  Private
const updateLaborerProfile = async (req, res, next) => {
    try {
        const laborer = await Labor.findOneAndUpdate(
            { user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!laborer) {
            return res.status(404).json({ success: false, message: 'Laborer profile not found' });
        }

        res.json({ success: true, data: laborer });
    } catch (error) {
        next(error);
    }
};

// @desc    Hire laborer
// @route   POST /api/labor/:id/hire
// @access  Private
const hireLaborer = async (req, res, next) => {
    try {
        const laborer = await Labor.findById(req.params.id);
        if (!laborer) {
            return res.status(404).json({ success: false, message: 'Laborer not found' });
        }
        if (!laborer.availability.isAvailable) {
            return res.status(400).json({ success: false, message: 'Laborer not available' });
        }

        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.status(400).json({ success: false, message: 'Farmer profile required' });
        }

        const { workDescription, workType, startDate, endDate, totalDays } = req.body;
        const totalWages = laborer.wages.daily * totalDays;

        const hiring = await LaborHiring.create({
            labor: laborer._id,
            farmer: farmer._id,
            workDescription,
            workType,
            startDate,
            endDate,
            totalDays,
            totalWages,
        });

        // Update laborer availability
        await Labor.findByIdAndUpdate(laborer._id, {
            'availability.isAvailable': false,
        });

        res.status(201).json({ success: true, data: hiring });
    } catch (error) {
        next(error);
    }
};

// @desc    Get hiring history
// @route   GET /api/labor/hiring
// @access  Private
const getHiringHistory = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const hirings = await LaborHiring.find({ farmer: farmer._id })
            .populate('labor', 'name phone skills wages')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: hirings });
    } catch (error) {
        next(error);
    }
};

// @desc    Update hiring status
// @route   PUT /api/labor/hiring/:id
// @access  Private
const updateHiringStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const hiring = await LaborHiring.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('labor');

        if (!hiring) {
            return res.status(404).json({ success: false, message: 'Hiring record not found' });
        }

        // If completed or cancelled, make laborer available again
        if (['completed', 'cancelled'].includes(status)) {
            await Labor.findByIdAndUpdate(hiring.labor._id, {
                'availability.isAvailable': true,
                $inc: { completedJobs: status === 'completed' ? 1 : 0 },
            });
        }

        res.json({ success: true, data: hiring });
    } catch (error) {
        next(error);
    }
};

// @desc    Get labor recommendations
// @route   POST /api/labor/recommend
// @access  Private
const getLaborRecommendations = async (req, res, next) => {
    try {
        const { task, farmSize, durationDays } = req.body; // task: sowing, harvesting, weeding, general

        let requiredSkills = [];
        let estimatedCount = 1;
        let estimateReason = '';

        // Determine skills
        const skillMap = {
            'harvesting': ['harvesting', 'threshing'],
            'sowing': ['sowing', 'planting'],
            'weeding': ['weeding'],
            'spraying': ['spraying', 'fertilizer_application'],
            'irrigation': ['irrigation'],
            'land_prep': ['ploughing', 'tilling']
        };
        requiredSkills = skillMap[task?.toLowerCase()] || ['general_farming'];

        // Estimate headcount
        if (task === 'harvesting') {
            // Approx 2 people per acre per day for manual harvest (very rough calc)
            // If duration is fixed, we need to adjust headcount
            const manDaysNeeded = farmSize * 2;
            estimatedCount = Math.ceil(manDaysNeeded / (durationDays || 1));
            estimateReason = `Harvesting ${farmSize} acres typically requires ~${manDaysNeeded} man-days.`;
        } else if (task === 'weeding') {
            const manDaysNeeded = farmSize * 1.5;
            estimatedCount = Math.ceil(manDaysNeeded / (durationDays || 1));
            estimateReason = `Weeding usually takes ~1.5 workers per acre per day.`;
        } else {
            const manDaysNeeded = farmSize * 1;
            estimatedCount = Math.ceil(manDaysNeeded / (durationDays || 1));
            estimateReason = `Standard estimation for ${task}.`;
        }

        // Find matches
        const recommendedLaborers = await Labor.find({
            'skills.skill': { $in: requiredSkills },
            'availability.isAvailable': true,
        }).limit(10);

        res.json({
            success: true,
            data: {
                task,
                estimatedLaborersNeeded: estimatedCount,
                requiredSkills,
                estimateReason,
                availableMatches: recommendedLaborers,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLaborers,
    getLaborerById,
    registerLaborer,
    registerAsLaborer,
    updateLaborerProfile,
    hireLaborer,
    getHiringHistory,
    updateHiringStatus,
    getLaborRecommendations,
};

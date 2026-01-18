const { Livestock, HealthRecord, Vaccination } = require('../models/Livestock');
const Farmer = require('../models/Farmer');
const { PAGINATION } = require('../config/constants');

// @desc    Get farmer's livestock
// @route   GET /api/livestock
// @access  Private
const getLivestock = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const { type, status } = req.query;
        const query = { farmer: farmer._id };
        if (type) query.type = type;
        if (status) query.status = status;

        const livestock = await Livestock.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: livestock });
    } catch (error) {
        next(error);
    }
};

// @desc    Get livestock by ID
// @route   GET /api/livestock/:id
// @access  Private
const getLivestockById = async (req, res, next) => {
    try {
        const livestock = await Livestock.findById(req.params.id)
            .populate('parentage.mother', 'name tagId')
            .populate('parentage.father', 'name tagId');

        if (!livestock) {
            return res.status(404).json({ success: false, message: 'Livestock not found' });
        }

        // Get health records and vaccinations
        const healthRecords = await HealthRecord.find({ livestock: livestock._id })
            .sort({ date: -1 }).limit(10);
        const vaccinations = await Vaccination.find({ livestock: livestock._id })
            .sort({ dateAdministered: -1 });

        res.json({
            success: true,
            data: { livestock, healthRecords, vaccinations },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add livestock
// @route   POST /api/livestock
// @access  Private
const addLivestock = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.status(400).json({ success: false, message: 'Farmer profile required' });
        }

        const livestock = await Livestock.create({
            farmer: farmer._id,
            ...req.body,
        });

        res.status(201).json({ success: true, data: livestock });
    } catch (error) {
        next(error);
    }
};

// @desc    Update livestock
// @route   PUT /api/livestock/:id
// @access  Private
const updateLivestock = async (req, res, next) => {
    try {
        const livestock = await Livestock.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!livestock) {
            return res.status(404).json({ success: false, message: 'Livestock not found' });
        }

        res.json({ success: true, data: livestock });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete livestock
// @route   DELETE /api/livestock/:id
// @access  Private
const deleteLivestock = async (req, res, next) => {
    try {
        const livestock = await Livestock.findByIdAndDelete(req.params.id);
        if (!livestock) {
            return res.status(404).json({ success: false, message: 'Livestock not found' });
        }
        res.json({ success: true, message: 'Livestock removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Add health record
// @route   POST /api/livestock/:id/health
// @access  Private
const addHealthRecord = async (req, res, next) => {
    try {
        const livestock = await Livestock.findById(req.params.id);
        if (!livestock) {
            return res.status(404).json({ success: false, message: 'Livestock not found' });
        }

        const healthRecord = await HealthRecord.create({
            livestock: livestock._id,
            ...req.body,
        });

        res.status(201).json({ success: true, data: healthRecord });
    } catch (error) {
        next(error);
    }
};

// @desc    Add vaccination
// @route   POST /api/livestock/:id/vaccination
// @access  Private
const addVaccination = async (req, res, next) => {
    try {
        const livestock = await Livestock.findById(req.params.id);
        if (!livestock) {
            return res.status(404).json({ success: false, message: 'Livestock not found' });
        }

        const vaccination = await Vaccination.create({
            livestock: livestock._id,
            ...req.body,
        });

        res.status(201).json({ success: true, data: vaccination });
    } catch (error) {
        next(error);
    }
};

// @desc    Get vaccination reminders
// @route   GET /api/livestock/vaccinations/reminders
// @access  Private
const getVaccinationReminders = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const livestock = await Livestock.find({ farmer: farmer._id });
        const livestockIds = livestock.map(l => l._id);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const reminders = await Vaccination.find({
            livestock: { $in: livestockIds },
            nextDueDate: { $lte: nextWeek },
        }).populate('livestock', 'name tagId type');

        res.json({ success: true, data: reminders });
    } catch (error) {
        next(error);
    }
};

// @desc    Get productivity stats
// @route   GET /api/livestock/productivity
// @access  Private
const getProductivityStats = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: null });
        }

        const livestock = await Livestock.find({ farmer: farmer._id, status: { $in: ['active', 'lactating'] } });

        const stats = {
            totalCount: livestock.length,
            byType: {},
            milkProduction: { daily: 0, monthly: 0 },
            eggProduction: { daily: 0, monthly: 0 },
        };

        livestock.forEach(animal => {
            stats.byType[animal.type] = (stats.byType[animal.type] || 0) + 1;
            if (animal.productivity?.milkYield) {
                stats.milkProduction.daily += animal.productivity.milkYield.daily || 0;
                stats.milkProduction.monthly += animal.productivity.milkYield.monthly || 0;
            }
            if (animal.productivity?.eggProduction) {
                stats.eggProduction.daily += animal.productivity.eggProduction.daily || 0;
                stats.eggProduction.monthly += animal.productivity.eggProduction.monthly || 0;
            }
        });

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLivestock,
    getLivestockById,
    addLivestock,
    updateLivestock,
    deleteLivestock,
    addHealthRecord,
    addVaccination,
    getVaccinationReminders,
    getProductivityStats,
};

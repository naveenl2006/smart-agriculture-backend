const { Equipment, EquipmentBooking } = require('../models/Equipment');
const Farmer = require('../models/Farmer');
const { PAGINATION } = require('../config/constants');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Public
const getEquipment = async (req, res, next) => {
    try {
        const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, type, state, available } = req.query;
        const query = { isActive: true };

        if (type) query.type = type;
        if (state) query['location.state'] = state;
        if (available === 'true') query['availability.isAvailable'] = true;

        const equipment = await Equipment.find(query)
            .populate('owner', 'name phone')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Equipment.countDocuments(query);

        res.json({
            success: true,
            data: {
                equipment,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get equipment by ID
// @route   GET /api/equipment/:id
// @access  Public
const getEquipmentById = async (req, res, next) => {
    try {
        const equipment = await Equipment.findById(req.params.id).populate('owner', 'name phone email');
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        res.json({ success: true, data: equipment });
    } catch (error) {
        next(error);
    }
};

// @desc    Create equipment listing
// @route   POST /api/equipment
// @access  Private
const createEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.create({
            ...req.body,
            owner: req.user.id,
        });
        res.status(201).json({ success: true, data: equipment });
    } catch (error) {
        next(error);
    }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private
const updateEquipment = async (req, res, next) => {
    try {
        let equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        if (equipment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, data: equipment });
    } catch (error) {
        next(error);
    }
};

// @desc    Book equipment
// @route   POST /api/equipment/:id/book
// @access  Private
const bookEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        if (!equipment.availability.isAvailable) {
            return res.status(400).json({ success: false, message: 'Equipment not available' });
        }

        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.status(400).json({ success: false, message: 'Farmer profile required' });
        }

        const { startDate, endDate, duration } = req.body;
        const totalCost = duration.unit === 'hours'
            ? equipment.pricing.hourlyRate * duration.value
            : equipment.pricing.dailyRate * duration.value;

        const booking = await EquipmentBooking.create({
            equipment: equipment._id,
            farmer: farmer._id,
            startDate,
            endDate,
            duration,
            totalCost,
            deposit: equipment.pricing.deposit,
        });

        // Update equipment availability
        await Equipment.findByIdAndUpdate(equipment._id, {
            'availability.isAvailable': false,
            'availability.nextAvailableDate': endDate,
            $inc: { totalBookings: 1 },
        });

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

// @desc    Get booking history
// @route   GET /api/equipment/bookings
// @access  Private
const getBookingHistory = async (req, res, next) => {
    try {
        const farmer = await Farmer.findOne({ user: req.user.id });
        if (!farmer) {
            return res.json({ success: true, data: [] });
        }

        const bookings = await EquipmentBooking.find({ farmer: farmer._id })
            .populate('equipment', 'name type images pricing')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
};

// @desc    Update booking status
// @route   PUT /api/equipment/bookings/:id
// @access  Private
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await EquipmentBooking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('equipment');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // If completed or cancelled, make equipment available again
        if (['completed', 'cancelled'].includes(status)) {
            await Equipment.findByIdAndUpdate(booking.equipment._id, {
                'availability.isAvailable': true,
            });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

// @desc    Add review for equipment
// @route   POST /api/equipment/bookings/:id/review
// @access  Private
const addReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const booking = await EquipmentBooking.findByIdAndUpdate(
            req.params.id,
            { review: { rating, comment, createdAt: new Date() } },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Update equipment rating
        const equipment = await Equipment.findById(booking.equipment);
        const newCount = equipment.rating.count + 1;
        const newAverage = ((equipment.rating.average * equipment.rating.count) + rating) / newCount;

        await Equipment.findByIdAndUpdate(booking.equipment, {
            'rating.average': Math.round(newAverage * 10) / 10,
            'rating.count': newCount,
        });

        res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

// @desc    Get recommended equipment
// @route   POST /api/equipment/recommend
// @access  Private
const getRecommendedEquipment = async (req, res, next) => {
    try {
        const { farmSize, operation, cropType } = req.body; // farmSize in acres

        // Define logic for recommendations
        let recommendedTypes = [];
        let reason = '';

        if (operation === 'land_preparation') {
            if (farmSize > 5) {
                recommendedTypes = ['tractor_4wd', 'rotavator_large', 'cultivator'];
                reason = 'Large field requires heavy duty tractors and rotavators for efficiency.';
            } else {
                recommendedTypes = ['power_tiller', 'mini_tractor', 'rotavator_small'];
                reason = 'Small field is best managed with power tillers or mini tractors.';
            }
        } else if (operation === 'sowing') {
            recommendedTypes = ['seed_drill', 'transplanter'];
            reason = 'Mechanized sowing ensures uniform spacing and seed depth.';
        } else if (operation === 'harvesting') {
            if (cropType?.toLowerCase() === 'paddy' || cropType?.toLowerCase() === 'wheat') {
                recommendedTypes = ['combine_harvester'];
                reason = 'Combine harvester reduces grain loss and time.';
            } else if (farmSize > 2) {
                recommendedTypes = ['reaper', 'thresher'];
                reason = 'Reapers and threshers speed up harvesting for medium fields.';
            } else {
                recommendedTypes = ['brush_cutter', 'hand_harvester'];
                reason = 'Manual or semi-automated tools are cost-effective for small plots.';
            }
        } else if (operation === 'spraying') {
            if (farmSize > 10) {
                recommendedTypes = ['boom_sprayer', 'drone'];
                reason = 'Drone or boom sprayers cover large areas quickly.';
            } else {
                recommendedTypes = ['power_sprayer', 'knapsack_sprayer'];
                reason = 'Standard sprayers are sufficient for this area.';
            }
        }

        // Find equipment matching types
        const recommendedEquipment = await Equipment.find({
            type: { $in: recommendedTypes },
            'availability.isAvailable': true,
        }).sort({ 'rating.average': -1 }).limit(10);

        res.json({
            success: true,
            data: {
                recommendedTypes,
                reason,
                equipment: recommendedEquipment,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    bookEquipment,
    getBookingHistory,
    updateBookingStatus,
    addReview,
    getRecommendedEquipment,
};

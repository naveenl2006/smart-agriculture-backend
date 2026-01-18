const CropSchedule = require('../models/CropSchedule');
const CROP_SCHEDULES = require('../data/cropScheduleData');

/**
 * @desc    Create a new crop schedule
 * @route   POST /api/crop-schedules
 * @access  Private
 */
const createSchedule = async (req, res, next) => {
    try {
        const { cropName, startDate, notes } = req.body;

        // Validate crop exists in schedule data
        const cropData = CROP_SCHEDULES[cropName];
        if (!cropData) {
            return res.status(400).json({
                success: false,
                message: `Schedule data not available for crop: ${cropName}`
            });
        }

        // Parse start date
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start date'
            });
        }

        // Generate activities from crop schedule data
        const activities = [];
        cropData.stages.forEach(stage => {
            stage.activities.forEach(activity => {
                const scheduledDate = new Date(start);
                scheduledDate.setDate(scheduledDate.getDate() + stage.dayOffset + activity.day);

                activities.push({
                    stageName: stage.name,
                    activityName: activity.task,
                    scheduledDate,
                    status: 'pending'
                });
            });
        });

        // Sort activities by scheduled date
        activities.sort((a, b) => a.scheduledDate - b.scheduledDate);

        // Calculate expected harvest date
        const expectedHarvestDate = new Date(start);
        expectedHarvestDate.setDate(expectedHarvestDate.getDate() + cropData.duration.max);

        // Create the schedule
        const schedule = await CropSchedule.create({
            user: req.user.id,
            cropName,
            startDate: start,
            expectedHarvestDate,
            status: 'active',
            activities,
            notes: notes || ''
        });

        res.status(201).json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all schedules for logged-in user
 * @route   GET /api/crop-schedules
 * @access  Private
 */
const getUserSchedules = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = { user: req.user.id };

        if (status) {
            query.status = status;
        }

        const schedules = await CropSchedule.find(query)
            .sort({ createdAt: -1 })
            .select('-activities'); // Exclude activities for list view

        res.json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single schedule with all activities
 * @route   GET /api/crop-schedules/:id
 * @access  Private
 */
const getScheduleById = async (req, res, next) => {
    try {
        const schedule = await CropSchedule.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update activity status
 * @route   PATCH /api/crop-schedules/:id/activities/:activityId
 * @access  Private
 */
const updateActivityStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'in-progress', 'completed', 'skipped'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const schedule = await CropSchedule.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Find and update the activity
        const activity = schedule.activities.id(req.params.activityId);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        activity.status = status;
        if (status === 'completed') {
            activity.completedDate = new Date();
        }

        // Check if all activities are completed
        const allCompleted = schedule.activities.every(a =>
            a.status === 'completed' || a.status === 'skipped'
        );
        if (allCompleted) {
            schedule.status = 'completed';
        }

        await schedule.save();

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a schedule
 * @route   DELETE /api/crop-schedules/:id
 * @access  Private
 */
const deleteSchedule = async (req, res, next) => {
    try {
        const schedule = await CropSchedule.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get upcoming activities (reminders)
 * @route   GET /api/crop-schedules/reminders
 * @access  Private
 */
const getReminders = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const schedules = await CropSchedule.find({
            user: req.user.id,
            status: 'active'
        });

        const reminders = [];
        schedules.forEach(schedule => {
            schedule.activities.forEach(activity => {
                const activityDate = new Date(activity.scheduledDate);
                activityDate.setHours(0, 0, 0, 0);

                if (activity.status === 'pending' && activityDate <= nextWeek) {
                    reminders.push({
                        scheduleId: schedule._id,
                        cropName: schedule.cropName,
                        activityId: activity._id,
                        stageName: activity.stageName,
                        activityName: activity.activityName,
                        scheduledDate: activity.scheduledDate,
                        isOverdue: activityDate < today,
                        isToday: activityDate.getTime() === today.getTime()
                    });
                }
            });
        });

        // Sort by date
        reminders.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

        res.json({
            success: true,
            count: reminders.length,
            data: reminders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get available crops for scheduling
 * @route   GET /api/crop-schedules/available-crops
 * @access  Public
 */
const getAvailableCrops = async (req, res, next) => {
    try {
        const crops = Object.keys(CROP_SCHEDULES).map(name => ({
            name,
            duration: CROP_SCHEDULES[name].duration,
            category: CROP_SCHEDULES[name].category,
            stageCount: CROP_SCHEDULES[name].stages.length
        }));

        res.json({
            success: true,
            count: crops.length,
            data: crops
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSchedule,
    getUserSchedules,
    getScheduleById,
    updateActivityStatus,
    deleteSchedule,
    getReminders,
    getAvailableCrops
};

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    createSchedule,
    getUserSchedules,
    getScheduleById,
    updateActivityStatus,
    deleteSchedule,
    getReminders,
    getAvailableCrops
} = require('../controllers/cropScheduleController');

// Public routes
router.get('/available-crops', getAvailableCrops);

// Protected routes
router.use(protect);

router.route('/')
    .get(getUserSchedules)
    .post(createSchedule);

router.get('/reminders', getReminders);

router.route('/:id')
    .get(getScheduleById)
    .delete(deleteSchedule);

router.patch('/:id/activities/:activityId', updateActivityStatus);

module.exports = router;

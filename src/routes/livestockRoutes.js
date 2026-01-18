const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');
const {
    getLivestock,
    getLivestockById,
    addLivestock,
    updateLivestock,
    deleteLivestock,
    addHealthRecord,
    addVaccination,
    getVaccinationReminders,
    getProductivityStats,
} = require('../controllers/livestockController');

// All routes are protected
router.use(protect);

// Main livestock routes
router.get('/', getLivestock);
router.get('/vaccinations/reminders', getVaccinationReminders);
router.get('/productivity', getProductivityStats);
router.get('/:id', getLivestockById);
router.post('/', uploadSingle('livestockImage'), addLivestock);
router.put('/:id', updateLivestock);
router.delete('/:id', deleteLivestock);

// Health and vaccination routes
router.post('/:id/health', addHealthRecord);
router.post('/:id/vaccination', addVaccination);

module.exports = router;

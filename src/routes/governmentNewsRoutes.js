const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getGovernmentNews,
    refreshGovernmentNews,
    getCategories,
} = require('../controllers/governmentNewsController');

// Public routes
router.get('/', getGovernmentNews);
router.get('/categories', getCategories);

// Protected routes
router.post('/refresh', protect, refreshGovernmentNews);

module.exports = router;

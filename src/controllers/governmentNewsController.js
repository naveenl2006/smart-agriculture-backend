const governmentNewsService = require('../services/governmentNewsService');

/**
 * @desc    Get all government news/important links
 * @route   GET /api/government-news
 * @access  Public
 */
const getGovernmentNews = async (req, res) => {
    try {
        const { category } = req.query;

        let news;
        if (category) {
            news = await governmentNewsService.getNewsByCategory(category);
        } else {
            news = await governmentNewsService.getActiveNews();
        }

        res.json({
            success: true,
            count: news.length,
            data: news,
        });
    } catch (error) {
        console.error('Error fetching government news:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch government news',
            error: error.message,
        });
    }
};

/**
 * @desc    Manually refresh/sync government news
 * @route   POST /api/government-news/refresh
 * @access  Private (authenticated users)
 */
const refreshGovernmentNews = async (req, res) => {
    try {
        const result = await governmentNewsService.syncImportantLinks();

        if (result.success) {
            const news = await governmentNewsService.getActiveNews();
            res.json({
                success: true,
                message: `Synced successfully: ${result.created} new, ${result.updated} updated`,
                count: news.length,
                data: news,
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error refreshing government news:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh government news',
            error: error.message,
        });
    }
};

/**
 * @desc    Get categories list
 * @route   GET /api/government-news/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
    const categories = [
        { id: 'all', name: 'All', nameTamil: 'அனைத்தும்' },
        { id: 'farmers', name: 'For Farmers', nameTamil: 'விவசாயிகளுக்கு' },
        { id: 'schemes', name: 'Schemes', nameTamil: 'திட்டங்கள்' },
        { id: 'resources', name: 'Resources', nameTamil: 'வளங்கள்' },
        { id: 'officials', name: 'Officials', nameTamil: 'அலுவலர்களுக்கு' },
    ];

    res.json({
        success: true,
        data: categories,
    });
};

module.exports = {
    getGovernmentNews,
    refreshGovernmentNews,
    getCategories,
};

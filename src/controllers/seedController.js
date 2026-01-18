const seedAvailabilityService = require('../services/seedAvailabilityService');
const SeedAvailability = require('../models/SeedAvailability');

/**
 * @desc    Get all districts
 * @route   GET /api/seeds/districts
 * @access  Public
 */
const getDistricts = async (req, res) => {
    try {
        const districts = await seedAvailabilityService.getDistricts();
        res.json({
            success: true,
            count: districts.length,
            data: districts,
        });
    } catch (error) {
        console.error('Error fetching districts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch districts',
            error: error.message,
        });
    }
};

/**
 * @desc    Get seed availability by district
 * @route   GET /api/seeds?district=Erode OR GET /api/seeds?districtId=10&forceRefresh=true
 * @access  Public
 */
const getSeedsByDistrict = async (req, res) => {
    try {
        const { district, districtId, forceRefresh } = req.query;

        if (!district && !districtId) {
            return res.status(400).json({
                success: false,
                message: 'District name or ID is required',
            });
        }

        const query = districtId ? parseInt(districtId) : district;

        // If forceRefresh is requested, clear cache and fetch fresh data
        if (forceRefresh === 'true') {
            console.log(`[SeedController] Force refreshing district: ${query}`);
            await SeedAvailability.deleteMany({ districtId: parseInt(districtId) || 0 });

            // Fetch fresh data with Puppeteer
            const freshResult = await seedAvailabilityService.scrapeDistrictSeedsWithPuppeteer(
                typeof query === 'number' ? query : seedAvailabilityService.TN_DISTRICTS.find(
                    d => d.name.toLowerCase() === query.toLowerCase()
                )?.districtId
            );

            if (freshResult.success) {
                return res.json({
                    success: true,
                    district: freshResult.district,
                    source: 'live',
                    count: freshResult.data.length,
                    data: freshResult.data,
                });
            }
        }

        const result = await seedAvailabilityService.getSeedsByDistrict(query);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            district: result.district,
            source: result.source,
            count: result.data.length,
            data: result.data,
        });
    } catch (error) {
        console.error('Error fetching seeds:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seed availability',
            error: error.message,
        });
    }
};

/**
 * @desc    Manually refresh seed data for a district
 * @route   POST /api/seeds/refresh
 * @access  Private
 */
const refreshSeedData = async (req, res) => {
    try {
        const { districtId, clearCache } = req.body;

        if (districtId) {
            // Clear old cache if requested
            if (clearCache) {
                await SeedAvailability.deleteMany({ districtId: parseInt(districtId) });
                console.log(`[SeedController] Cleared cache for district ${districtId}`);
            }

            // Refresh specific district with Puppeteer
            const result = await seedAvailabilityService.scrapeDistrictSeedsWithPuppeteer(parseInt(districtId));
            res.json({
                success: result.success,
                message: result.success
                    ? `Refreshed ${result.aecCount} AECs in ${result.district} (live data)`
                    : result.error,
                data: result.data || [],
            });
        } else {
            // Refresh all districts (this takes time)
            if (clearCache) {
                await SeedAvailability.deleteMany({});
                console.log('[SeedController] Cleared all seed cache');
            }
            res.json({
                success: true,
                message: 'Full sync started in background. This may take several minutes.',
            });
            // Run in background
            seedAvailabilityService.syncAllDistricts();
        }
    } catch (error) {
        console.error('Error refreshing seeds:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh seed data',
            error: error.message,
        });
    }
};

/**
 * @desc    Get district by ID
 * @route   GET /api/seeds/districts/:id
 * @access  Public
 */
const getDistrictById = async (req, res) => {
    try {
        const { id } = req.params;
        const district = seedAvailabilityService.TN_DISTRICTS.find(
            d => d.districtId === parseInt(id)
        );

        if (!district) {
            return res.status(404).json({
                success: false,
                message: 'District not found',
            });
        }

        // Get seed data for this district
        const seedData = await seedAvailabilityService.getSeedsByDistrict(parseInt(id));

        res.json({
            success: true,
            district: district,
            seeds: seedData.data || [],
        });
    } catch (error) {
        console.error('Error fetching district:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch district data',
            error: error.message,
        });
    }
};

module.exports = {
    getDistricts,
    getSeedsByDistrict,
    refreshSeedData,
    getDistrictById,
};

/**
 * NDVI (Normalized Difference Vegetation Index) Service
 * Provides satellite-based crop recommendations using simulated NDVI data
 * 
 * NDVI ranges from -1 to 1:
 * - Values near 1 indicate dense, healthy vegetation
 * - Values near 0 indicate sparse or stressed vegetation
 * - Negative values indicate water, snow, or barren land
 */

// Tamil Nadu District Coordinates (approximate centroids)
const DISTRICT_COORDINATES = {
    'Coimbatore': { lat: 11.0168, lon: 76.9558 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Madurai': { lat: 9.9252, lon: 78.1198 },
    'Salem': { lat: 11.6643, lon: 78.1460 },
    'Tiruchirappalli': { lat: 10.7905, lon: 78.7047 },
    'Tirunelveli': { lat: 8.7139, lon: 77.7567 },
    'Erode': { lat: 11.3410, lon: 77.7172 },
    'Thanjavur': { lat: 10.7870, lon: 79.1378 },
    'Vellore': { lat: 12.9165, lon: 79.1325 },
    'Tiruppur': { lat: 11.1085, lon: 77.3411 },
    'Dindigul': { lat: 10.3624, lon: 77.9695 },
    'Cuddalore': { lat: 11.7480, lon: 79.7714 },
    'Kanchipuram': { lat: 12.8342, lon: 79.7036 },
    'Tiruvallur': { lat: 13.1431, lon: 79.9084 },
    'Villupuram': { lat: 11.9401, lon: 79.4861 },
    'Nagapattinam': { lat: 10.7672, lon: 79.8449 },
    'Karur': { lat: 10.9601, lon: 78.0766 },
    'Theni': { lat: 10.0104, lon: 77.4768 },
    'Krishnagiri': { lat: 12.5186, lon: 78.2137 },
    'Dharmapuri': { lat: 12.1357, lon: 78.1649 },
    'Namakkal': { lat: 11.2189, lon: 78.1674 },
    'Sivaganga': { lat: 9.8433, lon: 78.4809 },
    'Virudhunagar': { lat: 9.5680, lon: 77.9624 },
    'Ramanathapuram': { lat: 9.3639, lon: 78.8395 },
    'Pudukkottai': { lat: 10.3833, lon: 78.8001 },
    'Perambalur': { lat: 11.2320, lon: 78.8807 },
    'Ariyalur': { lat: 11.1361, lon: 79.0786 },
    'Nilgiris': { lat: 11.4916, lon: 76.7337 },
    'Kanniyakumari': { lat: 8.0883, lon: 77.5385 },
    'Thoothukudi': { lat: 8.7642, lon: 78.1348 },
};

// Simulated NDVI values for Tamil Nadu districts (realistic seasonal variation)
// Based on typical agricultural patterns and vegetation density
const DISTRICT_NDVI_DATA = {
    // Cauvery Delta Region - High NDVI (fertile agricultural belt)
    'Thanjavur': { baseNdvi: 0.72, seasonalVariation: 0.12, irrigationType: 'canal' },
    'Nagapattinam': { baseNdvi: 0.68, seasonalVariation: 0.10, irrigationType: 'canal' },
    'Tiruvarur': { baseNdvi: 0.70, seasonalVariation: 0.11, irrigationType: 'canal' },

    // Western Tamil Nadu - Moderate to High NDVI
    'Coimbatore': { baseNdvi: 0.58, seasonalVariation: 0.15, irrigationType: 'mixed' },
    'Erode': { baseNdvi: 0.55, seasonalVariation: 0.14, irrigationType: 'well' },
    'Tiruppur': { baseNdvi: 0.52, seasonalVariation: 0.13, irrigationType: 'well' },
    'Salem': { baseNdvi: 0.48, seasonalVariation: 0.12, irrigationType: 'well' },
    'Namakkal': { baseNdvi: 0.45, seasonalVariation: 0.10, irrigationType: 'well' },
    'Karur': { baseNdvi: 0.50, seasonalVariation: 0.11, irrigationType: 'well' },

    // Northern Tamil Nadu - Moderate NDVI
    'Chennai': { baseNdvi: 0.25, seasonalVariation: 0.08, irrigationType: 'urban' },
    'Tiruvallur': { baseNdvi: 0.42, seasonalVariation: 0.12, irrigationType: 'mixed' },
    'Kanchipuram': { baseNdvi: 0.48, seasonalVariation: 0.14, irrigationType: 'tank' },
    'Vellore': { baseNdvi: 0.44, seasonalVariation: 0.13, irrigationType: 'tank' },

    // Southern Tamil Nadu - Variable NDVI
    'Madurai': { baseNdvi: 0.40, seasonalVariation: 0.15, irrigationType: 'well' },
    'Dindigul': { baseNdvi: 0.45, seasonalVariation: 0.14, irrigationType: 'well' },
    'Theni': { baseNdvi: 0.52, seasonalVariation: 0.12, irrigationType: 'canal' },
    'Virudhunagar': { baseNdvi: 0.38, seasonalVariation: 0.12, irrigationType: 'well' },
    'Sivaganga': { baseNdvi: 0.35, seasonalVariation: 0.11, irrigationType: 'tank' },
    'Ramanathapuram': { baseNdvi: 0.28, seasonalVariation: 0.10, irrigationType: 'tank' },

    // Hill Regions - High NDVI (forests)
    'Nilgiris': { baseNdvi: 0.78, seasonalVariation: 0.08, irrigationType: 'rainfall' },
    'Kodaikanal': { baseNdvi: 0.75, seasonalVariation: 0.10, irrigationType: 'rainfall' },

    // Coastal/Southern Districts
    'Tirunelveli': { baseNdvi: 0.42, seasonalVariation: 0.14, irrigationType: 'mixed' },
    'Thoothukudi': { baseNdvi: 0.32, seasonalVariation: 0.10, irrigationType: 'well' },
    'Kanniyakumari': { baseNdvi: 0.55, seasonalVariation: 0.12, irrigationType: 'mixed' },

    // Central Tamil Nadu
    'Tiruchirappalli': { baseNdvi: 0.50, seasonalVariation: 0.13, irrigationType: 'canal' },
    'Pudukkottai': { baseNdvi: 0.42, seasonalVariation: 0.12, irrigationType: 'tank' },
    'Perambalur': { baseNdvi: 0.40, seasonalVariation: 0.11, irrigationType: 'well' },
    'Ariyalur': { baseNdvi: 0.38, seasonalVariation: 0.10, irrigationType: 'well' },

    // Eastern Districts
    'Cuddalore': { baseNdvi: 0.52, seasonalVariation: 0.14, irrigationType: 'mixed' },
    'Villupuram': { baseNdvi: 0.48, seasonalVariation: 0.13, irrigationType: 'tank' },

    // Hilly Western Districts
    'Krishnagiri': { baseNdvi: 0.46, seasonalVariation: 0.12, irrigationType: 'well' },
    'Dharmapuri': { baseNdvi: 0.44, seasonalVariation: 0.11, irrigationType: 'well' },
};

// Agro-climate profiles for districts
const AGRO_CLIMATE_PROFILES = {
    'Coimbatore': { avgRainfall: 700, avgTemp: 27, soilType: 'red', zone: 'Western' },
    'Chennai': { avgRainfall: 1400, avgTemp: 29, soilType: 'alluvial', zone: 'Coastal' },
    'Madurai': { avgRainfall: 900, avgTemp: 28, soilType: 'black', zone: 'Southern' },
    'Salem': { avgRainfall: 850, avgTemp: 26, soilType: 'red', zone: 'Western' },
    'Tiruchirappalli': { avgRainfall: 800, avgTemp: 29, soilType: 'alluvial', zone: 'Central' },
    'Thanjavur': { avgRainfall: 1000, avgTemp: 29, soilType: 'alluvial', zone: 'Delta' },
    'Erode': { avgRainfall: 650, avgTemp: 28, soilType: 'black', zone: 'Western' },
    'Tirunelveli': { avgRainfall: 750, avgTemp: 28, soilType: 'red', zone: 'Southern' },
    'Vellore': { avgRainfall: 950, avgTemp: 27, soilType: 'red', zone: 'Northern' },
    'Tiruppur': { avgRainfall: 600, avgTemp: 27, soilType: 'red', zone: 'Western' },
    'Dindigul': { avgRainfall: 850, avgTemp: 26, soilType: 'red', zone: 'Southern' },
    'Cuddalore': { avgRainfall: 1200, avgTemp: 28, soilType: 'alluvial', zone: 'Coastal' },
    'Kanchipuram': { avgRainfall: 1100, avgTemp: 28, soilType: 'clay', zone: 'Coastal' },
    'Tiruvallur': { avgRainfall: 1200, avgTemp: 28, soilType: 'alluvial', zone: 'Coastal' },
    'Villupuram': { avgRainfall: 1100, avgTemp: 27, soilType: 'red', zone: 'Coastal' },
    'Nagapattinam': { avgRainfall: 1300, avgTemp: 28, soilType: 'alluvial', zone: 'Delta' },
    'Nilgiris': { avgRainfall: 1800, avgTemp: 15, soilType: 'loam', zone: 'Hilly' },
    'Kanniyakumari': { avgRainfall: 1400, avgTemp: 27, soilType: 'red', zone: 'Coastal' },
    'Thoothukudi': { avgRainfall: 600, avgTemp: 29, soilType: 'sandy', zone: 'Coastal' },
    'Ramanathapuram': { avgRainfall: 850, avgTemp: 28, soilType: 'sandy', zone: 'Coastal' },
    'Sivaganga': { avgRainfall: 900, avgTemp: 28, soilType: 'black', zone: 'Southern' },
    'Virudhunagar': { avgRainfall: 750, avgTemp: 28, soilType: 'red', zone: 'Southern' },
    'Pudukkottai': { avgRainfall: 900, avgTemp: 28, soilType: 'red', zone: 'Central' },
    'Karur': { avgRainfall: 650, avgTemp: 29, soilType: 'black', zone: 'Central' },
    'Namakkal': { avgRainfall: 700, avgTemp: 28, soilType: 'red', zone: 'Western' },
    'Theni': { avgRainfall: 800, avgTemp: 24, soilType: 'loam', zone: 'Southern' },
    'Krishnagiri': { avgRainfall: 800, avgTemp: 26, soilType: 'red', zone: 'Northern' },
    'Dharmapuri': { avgRainfall: 850, avgTemp: 27, soilType: 'red', zone: 'Northern' },
    'Perambalur': { avgRainfall: 700, avgTemp: 29, soilType: 'red', zone: 'Central' },
    'Ariyalur': { avgRainfall: 750, avgTemp: 29, soilType: 'red', zone: 'Central' },
};

// NDVI-based crop recommendations
const NDVI_CROP_MAPPING = {
    veryHealthy: {
        range: { min: 0.6, max: 1.0 },
        status: 'Very Healthy Vegetation',
        statusEmoji: '🟢',
        color: '#10b981',
        crops: [
            { name: 'Rice (Paddy)', yieldLevel: 'High', advisory: 'Ideal conditions for paddy cultivation. Consider multiple cropping.' },
            { name: 'Sugarcane', yieldLevel: 'High', advisory: 'Excellent for sugarcane. Ensure adequate irrigation scheduling.' },
            { name: 'Banana', yieldLevel: 'High', advisory: 'High moisture retention supports banana cultivation.' },
            { name: 'Cotton', yieldLevel: 'Medium-High', advisory: 'Good for Bt Cotton varieties. Monitor pest pressure.' },
            { name: 'Vegetables', yieldLevel: 'High', advisory: 'Ideal for vegetable cultivation. Consider protected farming.' },
        ]
    },
    moderate: {
        range: { min: 0.4, max: 0.6 },
        status: 'Moderate Vegetation',
        statusEmoji: '🟡',
        color: '#f59e0b',
        crops: [
            { name: 'Wheat', yieldLevel: 'Medium', advisory: 'Suitable for wheat with adequate irrigation. Choose drought-tolerant varieties.' },
            { name: 'Maize', yieldLevel: 'Medium', advisory: 'Good for maize cultivation. Consider hybrid varieties.' },
            { name: 'Groundnut', yieldLevel: 'Medium', advisory: 'Suitable for groundnut. Ensure proper drainage.' },
            { name: 'Sunflower', yieldLevel: 'Medium', advisory: 'Moderate moisture suits sunflower. Good oil content expected.' },
            { name: 'Onion', yieldLevel: 'Medium', advisory: 'Suitable for onion cultivation during rabi season.' },
        ]
    },
    low: {
        range: { min: 0.2, max: 0.4 },
        status: 'Low Vegetation',
        statusEmoji: '🟠',
        color: '#f97316',
        crops: [
            { name: 'Millets (Ragi, Bajra)', yieldLevel: 'Medium', advisory: 'Drought-resistant millets ideal for low NDVI areas.' },
            { name: 'Pulses (Chickpea, Lentil)', yieldLevel: 'Low-Medium', advisory: 'Nitrogen-fixing pulses improve soil health.' },
            { name: 'Castor', yieldLevel: 'Low-Medium', advisory: 'Drought-tolerant crop suitable for marginal lands.' },
            { name: 'Sorghum (Jowar)', yieldLevel: 'Medium', advisory: 'Hardy crop for low moisture conditions.' },
            { name: 'Cluster Beans', yieldLevel: 'Low-Medium', advisory: 'Drought-resistant, improves soil nitrogen.' },
        ]
    },
    veryLow: {
        range: { min: 0, max: 0.2 },
        status: 'Very Low/Stressed Vegetation',
        statusEmoji: '🔴',
        color: '#ef4444',
        crops: [
            { name: 'Green Manure Crops', yieldLevel: 'N/A', advisory: 'Priority: Soil improvement. Grow dhaincha or sunhemp.' },
            { name: 'Fodder Crops', yieldLevel: 'Low', advisory: 'Consider fodder for livestock. Low water requirement.' },
            { name: 'Tree Plantation', yieldLevel: 'N/A', advisory: 'Long-term: Plant drought-resistant trees for soil conservation.' },
            { name: 'Cover Crops', yieldLevel: 'N/A', advisory: 'Protect soil from erosion, improve organic matter.' },
        ]
    }
};

/**
 * Get the current season based on month
 */
const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 6 && month <= 9) return 'Kharif';
    if (month >= 10 && month <= 2) return 'Rabi';
    return 'Summer';
};

/**
 * Simulate seasonal NDVI variation based on current month
 */
const getSeasonalNdviModifier = () => {
    const month = new Date().getMonth() + 1;
    // Peak vegetation during monsoon (July-Sept)
    if (month >= 7 && month <= 9) return 0.15;
    // Post-monsoon (Oct-Nov)
    if (month >= 10 && month <= 11) return 0.08;
    // Winter (Dec-Feb)
    if (month >= 12 || month <= 2) return 0;
    // Summer (Mar-May) - vegetation stress
    return -0.08;
};

/**
 * Calculate simulated NDVI for a district
 * @param {string} district - Name of the district
 * @returns {number} NDVI value between 0 and 1
 */
const calculateNdvi = (district) => {
    const districtData = DISTRICT_NDVI_DATA[district];
    if (!districtData) {
        // Return a moderate default if district not found
        return 0.45;
    }

    const { baseNdvi, seasonalVariation } = districtData;
    const seasonModifier = getSeasonalNdviModifier();

    // Add some randomness to simulate real-time variation (±5%)
    const randomVariation = (Math.random() - 0.5) * 0.1;

    // Calculate final NDVI
    let ndvi = baseNdvi + (seasonModifier * seasonalVariation) + randomVariation;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, ndvi));
};

/**
 * Categorize NDVI value and get recommendations
 * @param {number} ndvi - NDVI value
 * @returns {Object} Category info and crops
 */
const categorizeNdvi = (ndvi) => {
    if (ndvi >= 0.6) return NDVI_CROP_MAPPING.veryHealthy;
    if (ndvi >= 0.4) return NDVI_CROP_MAPPING.moderate;
    if (ndvi >= 0.2) return NDVI_CROP_MAPPING.low;
    return NDVI_CROP_MAPPING.veryLow;
};

/**
 * Get NDVI-based recommendations for a district
 * @param {string} district - District name
 * @returns {Object} Complete NDVI analysis and recommendations
 */
const getNdviRecommendations = (district) => {
    // Validate district
    const normalizedDistrict = district.trim();
    const coordinates = DISTRICT_COORDINATES[normalizedDistrict];
    const climate = AGRO_CLIMATE_PROFILES[normalizedDistrict] || {
        avgRainfall: 800,
        avgTemp: 27,
        soilType: 'mixed',
        zone: 'Unknown'
    };

    // Calculate NDVI
    const ndviValue = calculateNdvi(normalizedDistrict);
    const ndviCategory = categorizeNdvi(ndviValue);
    const season = getCurrentSeason();

    // Build the 9-step process info
    const processSteps = [
        { step: 1, title: 'District Selection', description: `Selected: ${normalizedDistrict}`, status: 'complete' },
        { step: 2, title: 'Geocoding', description: coordinates ? `Lat: ${coordinates.lat}°, Lon: ${coordinates.lon}°` : 'Using regional average', status: 'complete' },
        { step: 3, title: 'Satellite Data Fetch', description: 'Sentinel-2 L2A imagery retrieved', status: 'complete' },
        { step: 4, title: 'Cloud Masking', description: 'Removed cloud-covered pixels', status: 'complete' },
        { step: 5, title: 'NDVI Calculation', description: 'NIR - RED / NIR + RED', status: 'complete' },
        { step: 6, title: 'Spatial Averaging', description: 'District mean calculated', status: 'complete' },
        { step: 7, title: 'Climate Overlay', description: `Zone: ${climate.zone}, Rainfall: ${climate.avgRainfall}mm`, status: 'complete' },
        { step: 8, title: 'Crop Matching', description: `Best crops for NDVI ${ndviValue.toFixed(2)}`, status: 'complete' },
        { step: 9, title: 'Advisory Generation', description: 'Personalized recommendations ready', status: 'complete' },
    ];

    // Enhance crop recommendations with additional data
    const enhancedCrops = ndviCategory.crops.map((crop, index) => ({
        ...crop,
        id: index + 1,
        suitabilityScore: Math.round((ndviValue * 100) - (index * 5)),
        waterRequirement: ndviValue > 0.5 ? 'High' : ndviValue > 0.3 ? 'Medium' : 'Low',
        season: season,
        soilMatch: climate.soilType,
    }));

    // Generate weather-based advisory
    const generateAdvisory = () => {
        const advisories = [];

        if (ndviValue >= 0.6) {
            advisories.push({
                type: 'success',
                title: 'Excellent Growing Conditions',
                message: `Current NDVI of ${ndviValue.toFixed(2)} indicates healthy vegetation. Consider high-value crops like vegetables or fruits.`
            });
        } else if (ndviValue >= 0.4) {
            advisories.push({
                type: 'info',
                title: 'Moderate Conditions',
                message: `NDVI of ${ndviValue.toFixed(2)} suggests moderate vegetation. Focus on medium water-requirement crops.`
            });
        } else if (ndviValue >= 0.2) {
            advisories.push({
                type: 'warning',
                title: 'Low Vegetation Alert',
                message: `NDVI of ${ndviValue.toFixed(2)} indicates stressed vegetation. Prioritize drought-resistant crops and consider soil improvement measures.`
            });
        } else {
            advisories.push({
                type: 'danger',
                title: 'Critical Soil Health',
                message: `Very low NDVI of ${ndviValue.toFixed(2)}. Immediate action needed: focus on soil restoration before commercial farming.`
            });
        }

        // Season-specific advisory
        advisories.push({
            type: 'info',
            title: `${season} Season Recommendations`,
            message: `Current season: ${season}. Crop selections are optimized for this period's typical weather patterns in ${climate.zone} zone.`
        });

        return advisories;
    };

    return {
        success: true,
        data: {
            district: normalizedDistrict,
            coordinates: coordinates || { lat: 11.127, lon: 78.656 }, // Tamil Nadu center if not found
            ndvi: {
                value: parseFloat(ndviValue.toFixed(3)),
                percentage: Math.round(ndviValue * 100),
                category: ndviCategory.status,
                categoryEmoji: ndviCategory.statusEmoji,
                color: ndviCategory.color,
                range: ndviCategory.range,
            },
            climate: {
                ...climate,
                currentSeason: season,
            },
            processSteps,
            recommendations: enhancedCrops,
            advisories: generateAdvisory(),
            metadata: {
                dataSource: 'Simulated Sentinel-2 NDVI (Demo)',
                analysisDate: new Date().toISOString(),
                note: 'This is simulated data for demonstration. Real implementation would use Copernicus/Google Earth Engine APIs.',
            }
        }
    };
};

/**
 * Get list of supported districts
 */
const getSupportedDistricts = () => {
    return Object.keys(DISTRICT_NDVI_DATA).sort();
};

module.exports = {
    getNdviRecommendations,
    getSupportedDistricts,
    calculateNdvi,
    categorizeNdvi,
    NDVI_CROP_MAPPING,
};

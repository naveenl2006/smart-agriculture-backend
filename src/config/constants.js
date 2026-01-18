module.exports = {
    // User Roles
    ROLES: {
        FARMER: 'farmer',
        ADMIN: 'admin',
        SERVICE_PROVIDER: 'service_provider',
    },

    // Soil Types
    SOIL_TYPES: ['clay', 'loam', 'sandy', 'black', 'red', 'alluvial'],

    // Seasons
    SEASONS: ['kharif', 'rabi', 'summer', 'zaid'],

    // Water Availability
    WATER_AVAILABILITY: ['low', 'medium', 'high'],

    // Equipment Types
    EQUIPMENT_TYPES: [
        'tractor',
        'harvester',
        'plough',
        'sprayer',
        'rotavator',
        'seed_drill',
        'thresher',
        'irrigation_pump',
    ],

    // Livestock Types
    LIVESTOCK_TYPES: ['cow', 'buffalo', 'goat', 'sheep', 'poultry', 'pig'],

    // Labor Skill Levels
    SKILL_LEVELS: ['unskilled', 'semi-skilled', 'skilled', 'expert'],

    // Booking Status
    BOOKING_STATUS: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],

    // Health Record Types
    HEALTH_RECORD_TYPES: ['checkup', 'treatment', 'surgery', 'vaccination'],

    // Pagination Defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100,
    },

    // Upload Limits
    UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    },

    // Indian States
    INDIAN_STATES: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    ],
};

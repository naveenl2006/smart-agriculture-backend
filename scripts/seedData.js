const dotenv = require('dotenv');
dotenv.config(); // Load env before anything else

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Crop = require('../src/models/Crop');
const { Equipment } = require('../src/models/Equipment');
const { Labor } = require('../src/models/Labor');
const User = require('../src/models/User');

const seedCrops = [
    {
        name: 'Rice (Paddy)',
        category: 'grain',
        seasons: ['kharif', 'rabi'],
        suitableSoilTypes: ['clay', 'loam', 'alluvial'],
        waterRequirement: 'high',
        growingPeriod: { min: 120, max: 150 },
        avgYield: { value: 2500, unit: 'kg/acre' },
        fertilizers: [
            { name: 'Urea', quantity: '50 kg/acre', stage: 'Basal' },
            { name: 'DAP', quantity: '50 kg/acre', stage: 'Basal' }
        ],
        marketPrice: { modal: 25 }
    },
    {
        name: 'Wheat',
        category: 'grain',
        seasons: ['rabi'],
        suitableSoilTypes: ['loam', 'clay'],
        waterRequirement: 'medium',
        growingPeriod: { min: 100, max: 130 },
        avgYield: { value: 2000, unit: 'kg/acre' },
        marketPrice: { modal: 30 }
    },
    {
        name: 'Tomato',
        category: 'vegetable',
        seasons: ['kharif', 'rabi', 'summer'],
        suitableSoilTypes: ['loam', 'sandy', 'black'],
        waterRequirement: 'high',
        growingPeriod: { min: 90, max: 120 },
        avgYield: { value: 8000, unit: 'kg/acre' },
        marketPrice: { modal: 40 }
    },
    {
        name: 'Cotton',
        category: 'cash_crop',
        seasons: ['kharif'],
        suitableSoilTypes: ['black', 'alluvial'],
        waterRequirement: 'medium',
        growingPeriod: { min: 150, max: 180 },
        avgYield: { value: 1000, unit: 'kg/acre' },
        marketPrice: { modal: 60 }
    },
    {
        name: 'Coconut',
        category: 'cash_crop',
        seasons: ['all'],
        suitableSoilTypes: ['sandy', 'alluvial', 'red'],
        waterRequirement: 'medium',
        growingPeriod: { min: 365, max: 365 },
        avgYield: { value: 12000, unit: 'nuts/acre' },
        marketPrice: { modal: 25 }
    }
];

const seedEquipment = [
    {
        name: 'John Deere 5310',
        type: 'tractor_4wd',
        description: '55 HP, 4WD Tractor suitable for heavy field work.',
        pricing: {
            hourlyRate: 800,
            dailyRate: 6000,
            deposit: 2000
        },
        location: {
            state: 'Kerala',
            district: 'Ernakulam',
            subDistrict: 'Aluva'
        },
        availability: { isAvailable: true },
        rating: { average: 4.5, count: 10 }
    },
    {
        name: 'Kubota Harvester',
        type: 'combine_harvester',
        description: 'Efficient paddy harvester.',
        pricing: {
            hourlyRate: 1500,
            dailyRate: 12000,
            deposit: 5000
        },
        location: {
            state: 'Kerala',
            district: 'Palakkad'
        },
        availability: { isAvailable: true },
        rating: { average: 4.8, count: 15 }
    },
    {
        name: 'Honda Power Tiller',
        type: 'power_tiller',
        description: 'Compact tiller for small farms.',
        pricing: {
            hourlyRate: 300,
            dailyRate: 2000,
            deposit: 500
        },
        location: {
            state: 'Kerala',
            district: 'Thrissur'
        },
        availability: { isAvailable: true }
    }
];

const seedLaborers = [
    {
        name: 'Mani Kandan',
        phone: '9876543210',
        skills: [
            { skill: 'harvesting', level: 'expert', yearsExperience: 10 },
            { skill: 'planting', level: 'skilled', yearsExperience: 5 }
        ],
        wages: { daily: 800, hourly: 100 },
        location: {
            state: 'Kerala',
            district: 'Palakkad'
        },
        availability: { isAvailable: true }
    },
    {
        name: 'Latha Nair',
        phone: '9876543211',
        skills: [
            { skill: 'weeding', level: 'expert', yearsExperience: 8 },
            { skill: 'transplanting', level: 'skilled', yearsExperience: 6 }
        ],
        wages: { daily: 600, hourly: 80 },
        location: {
            state: 'Kerala',
            district: 'Alappuzha'
        },
        availability: { isAvailable: true }
    }
];

const importData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Crop.deleteMany();
        await Equipment.deleteMany();
        await Labor.deleteMany();

        console.log('Data Cleared...');

        // Create a dummy admin user to own equipment if needed
        let adminUser = await User.findOne({ email: 'admin@example.com' });
        if (!adminUser) {
            // In a real seeder we might create one, but let's assume one exists or just skip owner for simple listing testing if schema allows
            // Actually Equipment requires owner.
            // We'll skip creating user to avoid auth complexity, and just create equipment without owner validation if logic allows, 
            // OR create a dummy user here.
            adminUser = await User.create({
                name: 'Admin Seeder',
                email: 'admin@seed.com',
                password: 'password123', // plaintext, model will hash
                role: 'admin'
            });
        }

        const equipmentWithUser = seedEquipment.map(e => ({ ...e, owner: adminUser._id }));
        const laborersWithUser = seedLaborers.map(l => ({ ...l, user: adminUser._id })); // Labor model links 1:1 to User usually? 
        // Checking Labor model... Usually Labor profile is linked to a User account. 
        // If Labor schema requires 'user' field, we need unique users.

        // Let's create specific users for laborers
        for (const laborData of seedLaborers) {
            const laborUser = await User.create({
                name: laborData.name,
                email: `labor_${Math.random().toString(36).substring(7)}@test.com`,
                password: 'password123',
                role: 'laborer'
            });
            await Labor.create({ ...laborData, user: laborUser._id });
        }

        await Crop.insertMany(seedCrops);
        await Equipment.insertMany(equipmentWithUser);

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await Crop.deleteMany();
        await Equipment.deleteMany();
        await Labor.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}

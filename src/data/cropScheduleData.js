/**
 * Crop Schedule Data - Extracted from 134.txt
 * Contains detailed cultivation schedules for 20+ crops
 */

const CROP_SCHEDULES = {
    'Rice': {
        duration: { min: 120, max: 150, unit: 'days' },
        category: 'cereal',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -20,
                duration: 20,
                activities: [
                    { task: 'Deep ploughing followed by puddling', day: 0 },
                    { task: 'Level field for uniform water distribution', day: 5 },
                    { task: 'Apply FYM 5-6 tons/acre', day: 10 }
                ]
            },
            {
                name: 'Nursery Preparation',
                dayOffset: -25,
                duration: 25,
                activities: [
                    { task: 'Prepare nursery beds (1/10th of field)', day: 0 },
                    { task: 'Soak seeds in water for 24 hours', day: 0 },
                    { task: 'Treat seeds with fungicide', day: 1 },
                    { task: 'Sow seeds in nursery', day: 2 },
                    { task: 'Maintain 2-3 cm water level', day: 3 }
                ]
            },
            {
                name: 'Transplanting',
                dayOffset: 0,
                duration: 7,
                activities: [
                    { task: 'Check seedlings are 6-8 inches tall', day: 0 },
                    { task: 'Transplant 2-3 seedlings per hill', day: 1 },
                    { task: 'Maintain spacing 20x15 cm', day: 1 },
                    { task: 'Maintain 5-7 cm water depth', day: 2 }
                ]
            },
            {
                name: 'Fertilizer Application',
                dayOffset: 0,
                duration: 60,
                activities: [
                    { task: 'Apply N:P:K basal dose', day: 0 },
                    { task: 'First weeding', day: 20 },
                    { task: 'Apply nitrogen at tillering stage', day: 25 },
                    { task: 'Second weeding', day: 40 },
                    { task: 'Apply nitrogen at panicle stage', day: 45 },
                    { task: 'Third weeding', day: 60 }
                ]
            },
            {
                name: 'Water Management',
                dayOffset: 0,
                duration: 110,
                activities: [
                    { task: 'Keep field flooded (2-3 inches)', day: 0 },
                    { task: 'Monitor for stem borer and leaf folder', day: 30 },
                    { task: 'Continue flooding', day: 60 },
                    { task: 'Stop water 10 days before harvest', day: 110 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 120,
                duration: 15,
                activities: [
                    { task: 'Check 80% grains turn golden yellow', day: 0 },
                    { task: 'Harvest when moisture is 20-25%', day: 5 },
                    { task: 'Dry to 12-14% for storage', day: 10 }
                ]
            }
        ]
    },
    'Wheat': {
        duration: { min: 120, max: 150, unit: 'days' },
        category: 'cereal',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -15,
                duration: 15,
                activities: [
                    { task: '2-3 deep ploughings', day: 0 },
                    { task: 'Level field for proper irrigation', day: 7 },
                    { task: 'Apply FYM 4-5 tons/acre', day: 10 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 3,
                activities: [
                    { task: 'Seed rate: 40-50 kg/acre', day: 0 },
                    { task: 'Sow at 5-6 cm depth', day: 0 },
                    { task: 'Row spacing: 20-23 cm', day: 0 }
                ]
            },
            {
                name: 'Irrigation & Fertilizer',
                dayOffset: 20,
                duration: 100,
                activities: [
                    { task: 'First irrigation at CRI stage (20-25 days)', day: 0 },
                    { task: 'Apply first nitrogen top dressing', day: 5 },
                    { task: 'Weeding at 30-35 days', day: 15 },
                    { task: 'Second irrigation at tillering', day: 25 },
                    { task: 'Third irrigation at stem elongation', day: 45 },
                    { task: 'Apply second nitrogen top dressing', day: 50 },
                    { task: 'Fourth irrigation at flowering', day: 65 },
                    { task: 'Fifth irrigation at grain filling', day: 85 }
                ]
            },
            {
                name: 'Pest Management',
                dayOffset: 40,
                duration: 60,
                activities: [
                    { task: 'Monitor for aphids', day: 0 },
                    { task: 'Check for termites', day: 20 },
                    { task: 'Spray insecticide if needed', day: 30 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 120,
                duration: 15,
                activities: [
                    { task: 'Check grains harden and straw turns yellow', day: 0 },
                    { task: 'Harvest at 20-25% moisture', day: 5 },
                    { task: 'Dry to 12% for storage', day: 10 }
                ]
            }
        ]
    },
    'Maize': {
        duration: { min: 90, max: 110, unit: 'days' },
        category: 'cereal',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -10,
                duration: 10,
                activities: [
                    { task: '2-3 ploughings (8-10 inches deep)', day: 0 },
                    { task: 'Apply FYM 5 tons/acre', day: 5 },
                    { task: 'Make ridges 24 inches apart', day: 8 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 3,
                activities: [
                    { task: 'Seed rate: 8-10 kg/acre', day: 0 },
                    { task: 'Spacing: 60x20 cm', day: 0 },
                    { task: 'Depth: 5-6 cm', day: 0 },
                    { task: 'Apply basal fertilizer', day: 0 }
                ]
            },
            {
                name: 'Early Growth',
                dayOffset: 7,
                duration: 35,
                activities: [
                    { task: 'Watch for cutworms', day: 0 },
                    { task: 'Thinning at 15-20 days', day: 10 },
                    { task: 'First weeding at 20-25 days', day: 15 },
                    { task: 'First urea application (25 kg/acre)', day: 20 },
                    { task: 'Earthing up at 30-35 days', day: 25 }
                ]
            },
            {
                name: 'Growing Phase',
                dayOffset: 40,
                duration: 30,
                activities: [
                    { task: 'Second urea application', day: 5 },
                    { task: 'Second weeding', day: 10 },
                    { task: 'Irrigation at tasseling (critical)', day: 20 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 90,
                duration: 15,
                activities: [
                    { task: 'Check silks turn brown and dry', day: 0 },
                    { task: 'Kernels should be full and hard', day: 5 },
                    { task: 'Harvest and dry cobs', day: 10 }
                ]
            }
        ]
    },
    'Potato': {
        duration: { min: 90, max: 120, unit: 'days' },
        category: 'vegetable',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -15,
                duration: 15,
                activities: [
                    { task: '3-4 ploughings', day: 0 },
                    { task: 'Use rotavator for fine soil', day: 5 },
                    { task: 'Add 8-10 trolleys well-rotted cow dung', day: 8 },
                    { task: 'Make ridges 20-24 inches apart', day: 12 }
                ]
            },
            {
                name: 'Planting',
                dayOffset: 0,
                duration: 3,
                activities: [
                    { task: 'Cut seed potatoes (40-50g pieces with 2-3 eyes)', day: -1 },
                    { task: 'Treat with fungicide', day: 0 },
                    { task: 'Plant at 8 inch spacing, 3-4 inch depth', day: 1 },
                    { task: 'Apply basal fertilizer', day: 1 },
                    { task: 'Water immediately', day: 1 }
                ]
            },
            {
                name: 'Early Growth',
                dayOffset: 10,
                duration: 30,
                activities: [
                    { task: 'Sprouting visible (10-15 days)', day: 0 },
                    { task: 'Light irrigation if dry', day: 5 },
                    { task: 'Earthing up at 20-25 days', day: 15 },
                    { task: 'First urea application (50 kg/acre)', day: 20 }
                ]
            },
            {
                name: 'Tuber Formation',
                dayOffset: 40,
                duration: 50,
                activities: [
                    { task: 'Flowering starts - tubers forming', day: 5 },
                    { task: 'Keep soil evenly moist', day: 10 },
                    { task: 'Second urea application (30 kg/acre)', day: 15 },
                    { task: 'Watch for late blight', day: 20 },
                    { task: 'Spray fungicide every 10-15 days', day: 25 },
                    { task: 'Stop irrigation 7-10 days before harvest', day: 45 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 90,
                duration: 15,
                activities: [
                    { task: 'Check leaves turn yellow', day: 0 },
                    { task: 'Dig test - skin should be firm', day: 3 },
                    { task: 'Harvest carefully - avoid cuts', day: 7 },
                    { task: 'Cure in shade for 10-15 days', day: 10 }
                ]
            }
        ]
    },
    'Tomato': {
        duration: { min: 120, max: 150, unit: 'days' },
        category: 'vegetable',
        stages: [
            {
                name: 'Nursery',
                dayOffset: -30,
                duration: 30,
                activities: [
                    { task: 'Prepare nursery beds', day: 0 },
                    { task: 'Soak seeds 30 min, treat with fungicide', day: 1 },
                    { task: 'Sow seeds in lines 4 inches apart', day: 2 },
                    { task: 'Water with rose can daily', day: 3 },
                    { task: 'Provide 50% shade', day: 3 },
                    { task: 'Seedlings ready at 25-30 days', day: 25 }
                ]
            },
            {
                name: 'Transplanting',
                dayOffset: 0,
                duration: 7,
                activities: [
                    { task: 'Water nursery heavily day before', day: -1 },
                    { task: 'Prepare beds with basal fertilizer', day: 0 },
                    { task: 'Transplant at 1.5x1.5 feet spacing', day: 1 },
                    { task: 'Water immediately after planting', day: 1 },
                    { task: 'Gap filling at 7 days', day: 7 }
                ]
            },
            {
                name: 'Staking & Growth',
                dayOffset: 15,
                duration: 30,
                activities: [
                    { task: 'Install stakes (4-5 feet)', day: 0 },
                    { task: 'Tie plants loosely', day: 5 },
                    { task: 'First urea application (50 kg/acre)', day: 10 },
                    { task: 'First weeding', day: 10 },
                    { task: 'Start pruning side shoots', day: 15 },
                    { task: 'Second weeding at 40-45 days', day: 25 }
                ]
            },
            {
                name: 'Flowering & Fruiting',
                dayOffset: 45,
                duration: 35,
                activities: [
                    { task: 'Flowering starts (40-50 days)', day: 0 },
                    { task: 'Second fertilizer (40 kg urea + 20 kg potash)', day: 10 },
                    { task: 'Spray for fruit borer every 10 days', day: 15 },
                    { task: 'Third fertilizer (30 kg urea)', day: 25 },
                    { task: 'Calcium spray for blossom end rot', day: 30 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 80,
                duration: 60,
                activities: [
                    { task: 'First harvest at 70-80 days', day: 0 },
                    { task: 'Pick at breaker/turning stage for market', day: 0 },
                    { task: 'Harvest every 3-4 days', day: 5 },
                    { task: 'Continue for 2-3 months', day: 30 },
                    { task: 'Grade by size before selling', day: 30 }
                ]
            }
        ]
    },
    'Chilli': {
        duration: { min: 150, max: 210, unit: 'days' },
        category: 'vegetable',
        stages: [
            {
                name: 'Nursery',
                dayOffset: -40,
                duration: 40,
                activities: [
                    { task: 'Prepare nursery beds', day: 0 },
                    { task: 'Soak seeds 6-8 hours', day: 1 },
                    { task: 'Treat with Trichoderma', day: 1 },
                    { task: 'Sow seeds in lines', day: 2 },
                    { task: 'Cover with dry grass', day: 2 },
                    { task: 'Remove grass at sprouting (6-8 days)', day: 8 },
                    { task: 'Ready to transplant at 35-40 days', day: 35 }
                ]
            },
            {
                name: 'Transplanting',
                dayOffset: 0,
                duration: 10,
                activities: [
                    { task: 'Prepare raised beds with fertilizer', day: -2 },
                    { task: 'Transplant at 2ft x 1.5ft spacing', day: 0 },
                    { task: 'Water daily for first week', day: 1 },
                    { task: 'Gap filling at 7 days', day: 7 }
                ]
            },
            {
                name: 'Growth Phase',
                dayOffset: 25,
                duration: 30,
                activities: [
                    { task: 'First urea application (50 kg/acre)', day: 0 },
                    { task: 'First weeding', day: 0 },
                    { task: 'Light earthing up', day: 5 },
                    { task: 'Second weeding at 40-45 days', day: 20 },
                    { task: 'Spray for thrips every 10 days', day: 10 }
                ]
            },
            {
                name: 'Flowering',
                dayOffset: 50,
                duration: 30,
                activities: [
                    { task: 'Flowers appear (50-60 days)', day: 0 },
                    { task: 'Second fertilizer (40 kg urea + 25 kg potash)', day: 5 },
                    { task: 'Watch for fruit borer', day: 10 },
                    { task: 'Spray insecticide every 7-10 days', day: 10 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 80,
                duration: 90,
                activities: [
                    { task: 'First harvest at 70-80 days', day: 0 },
                    { task: 'Pick green chillies when firm', day: 0 },
                    { task: 'Third fertilizer after first harvest', day: 5 },
                    { task: 'Harvest every 10-15 days', day: 15 },
                    { task: 'Fourth fertilizer at 110 days', day: 30 },
                    { task: 'Continue 6-10 pickings over 2-3 months', day: 60 }
                ]
            }
        ]
    },
    'Sugarcane': {
        duration: { min: 360, max: 450, unit: 'days' },
        category: 'cash_crop',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -20,
                duration: 20,
                activities: [
                    { task: 'Deep ploughing (12-15 inches)', day: 0 },
                    { task: '3-4 ploughings', day: 5 },
                    { task: 'Add 10 trolleys FYM/acre', day: 10 },
                    { task: 'Prepare furrows (30-36 inches apart)', day: 15 }
                ]
            },
            {
                name: 'Planting',
                dayOffset: 0,
                duration: 7,
                activities: [
                    { task: 'Prepare setts (2-3 buds each)', day: -1 },
                    { task: 'Treat setts with fungicide', day: 0 },
                    { task: 'Place setts end-to-end in furrow', day: 1 },
                    { task: 'Apply basal fertilizer', day: 1 },
                    { task: 'Cover and irrigate', day: 2 }
                ]
            },
            {
                name: 'Early Growth',
                dayOffset: 15,
                duration: 90,
                activities: [
                    { task: 'Shoots emerge (15-20 days)', day: 0 },
                    { task: 'Gap filling at 30 days', day: 15 },
                    { task: 'First weeding at 30-40 days', day: 20 },
                    { task: 'Second fertilizer at 60 days', day: 45 },
                    { task: 'Earthing up', day: 50 }
                ]
            },
            {
                name: 'Grand Growth',
                dayOffset: 120,
                duration: 120,
                activities: [
                    { task: 'Irrigate every 10-15 days', day: 0 },
                    { task: 'Third fertilizer at 120 days', day: 0 },
                    { task: 'Second earthing up', day: 15 },
                    { task: 'Watch for borers', day: 30 },
                    { task: 'Regular weeding', day: 45 }
                ]
            },
            {
                name: 'Maturity',
                dayOffset: 300,
                duration: 60,
                activities: [
                    { task: 'Stop fertilizer application', day: 0 },
                    { task: 'Continue irrigation', day: 15 },
                    { task: 'Stop water 2-3 weeks before harvest', day: 40 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 360,
                duration: 30,
                activities: [
                    { task: 'Check leaves yellowing', day: 0 },
                    { task: 'Test sugar content (18-20%)', day: 5 },
                    { task: 'Detrash and cut close to ground', day: 10 },
                    { task: 'Send to mill within 24 hours', day: 15 }
                ]
            }
        ]
    },
    'Groundnut': {
        duration: { min: 110, max: 140, unit: 'days' },
        category: 'oilseed',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -15,
                duration: 15,
                activities: [
                    { task: 'Deep ploughing (10-12 inches)', day: 0 },
                    { task: '3 ploughings for fine soil', day: 5 },
                    { task: 'Add 5 trolleys FYM/acre', day: 10 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 3,
                activities: [
                    { task: 'Coat seeds with Rhizobium culture', day: -1 },
                    { task: 'Sow at 30x10 cm spacing', day: 0 },
                    { task: 'Apply gypsum 80 kg/acre', day: 0 },
                    { task: 'Basal fertilizer with minimal urea', day: 0 }
                ]
            },
            {
                name: 'Early Growth',
                dayOffset: 15,
                duration: 25,
                activities: [
                    { task: 'Thinning at 15 days', day: 0 },
                    { task: 'First weeding at 20-25 days', day: 10 },
                    { task: 'Earthing up at 30 days', day: 15 }
                ]
            },
            {
                name: 'Flowering',
                dayOffset: 40,
                duration: 40,
                activities: [
                    { task: 'Yellow flowers appear', day: 0 },
                    { task: 'Keep soil loose for pegging', day: 5 },
                    { task: 'Second weeding at 45 days', day: 10 },
                    { task: 'Irrigate every 10-12 days', day: 15 },
                    { task: 'Watch for leaf miner', day: 20 }
                ]
            },
            {
                name: 'Pod Development',
                dayOffset: 80,
                duration: 30,
                activities: [
                    { task: 'Keep soil moist', day: 0 },
                    { task: 'Spray for tikka disease', day: 10 },
                    { task: 'Stop watering 2 weeks before harvest', day: 15 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 110,
                duration: 15,
                activities: [
                    { task: 'Lower leaves turn yellow', day: 0 },
                    { task: 'Dig test - veins dark brown', day: 3 },
                    { task: 'Dig and stack upside down', day: 7 },
                    { task: 'Pod picking after 2-3 days', day: 10 },
                    { task: 'Dry pods for 5-7 days', day: 12 }
                ]
            }
        ]
    },
    'Mustard': {
        duration: { min: 90, max: 120, unit: 'days' },
        category: 'oilseed',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -10,
                duration: 10,
                activities: [
                    { task: '2-3 ploughings', day: 0 },
                    { task: 'Apply FYM 4 tons/acre', day: 5 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 3,
                activities: [
                    { task: 'Seed rate: 2-3 kg/acre', day: 0 },
                    { task: 'Spacing: 30-45x15 cm', day: 0 },
                    { task: 'Depth: 3-4 cm', day: 0 }
                ]
            },
            {
                name: 'Care & Management',
                dayOffset: 20,
                duration: 60,
                activities: [
                    { task: 'Irrigation at branching stage', day: 0 },
                    { task: 'First weeding at 25 days', day: 5 },
                    { task: 'Nitrogen top dressing', day: 10 },
                    { task: 'Second weeding at 45 days', day: 25 },
                    { task: 'Irrigation at flowering', day: 30 },
                    { task: 'Watch for aphids', day: 40 },
                    { task: 'Irrigation at pod formation', day: 50 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 90,
                duration: 15,
                activities: [
                    { task: '75% pods turn yellowish-brown', day: 0 },
                    { task: 'Harvest in morning to avoid shattering', day: 5 },
                    { task: 'Dry pods before threshing', day: 10 }
                ]
            }
        ]
    },
    'Sunflower': {
        duration: { min: 95, max: 120, unit: 'days' },
        category: 'oilseed',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -10,
                duration: 10,
                activities: [
                    { task: 'One deep ploughing (8-10 inches)', day: 0 },
                    { task: '2-3 harrowings', day: 5 },
                    { task: 'Apply FYM 4-5 trolleys/acre', day: 7 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 5,
                activities: [
                    { task: 'Seed rate: 2.5-3 kg/acre', day: 0 },
                    { task: 'Spacing: 60x25 cm', day: 0 },
                    { task: 'Apply basal fertilizer', day: 0 },
                    { task: 'First irrigation', day: 1 }
                ]
            },
            {
                name: 'Vegetative Growth',
                dayOffset: 15,
                duration: 35,
                activities: [
                    { task: 'Thinning at 15-20 days', day: 0 },
                    { task: 'Weeding at 20-25 days', day: 10 },
                    { task: 'First urea application (35 kg/acre)', day: 15 },
                    { task: 'Earthing up', day: 20 }
                ]
            },
            {
                name: 'Flowering',
                dayOffset: 50,
                duration: 30,
                activities: [
                    { task: 'Bud formation starts', day: 0 },
                    { task: 'Second urea application (30 kg/acre)', day: 5 },
                    { task: 'Critical irrigation at flowering', day: 10 },
                    { task: 'Watch for capitulum borer', day: 15 },
                    { task: 'Bird protection needed', day: 25 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 95,
                duration: 15,
                activities: [
                    { task: 'Back of head turns brown', day: 0 },
                    { task: 'Seeds are hard when rubbed', day: 3 },
                    { task: 'Cut heads with 2-3 inch stem', day: 7 },
                    { task: 'Dry and thresh', day: 10 }
                ]
            }
        ]
    },
    'Chickpea': {
        duration: { min: 120, max: 150, unit: 'days' },
        category: 'pulse',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -10,
                duration: 10,
                activities: [
                    { task: '1-2 light ploughings', day: 0 },
                    { task: 'Apply FYM 2-3 tons/acre', day: 5 },
                    { task: 'Avoid waterlogged areas', day: 7 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 3,
                activities: [
                    { task: 'Seed treatment with Rhizobium', day: -1 },
                    { task: 'Seed rate: 30-40 kg/acre', day: 0 },
                    { task: 'Spacing: 30x10 cm, Depth: 7-10 cm', day: 0 }
                ]
            },
            {
                name: 'Care & Management',
                dayOffset: 20,
                duration: 70,
                activities: [
                    { task: 'Irrigation at pre-flowering', day: 10 },
                    { task: 'Weeding at 30-35 days', day: 15 },
                    { task: 'Watch for pod borer', day: 40 },
                    { task: 'Irrigation at pod formation', day: 50 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 120,
                duration: 15,
                activities: [
                    { task: '80% pods turn brown', day: 0 },
                    { task: 'Harvest before over-maturity', day: 7 },
                    { task: 'Avoid shattering', day: 10 }
                ]
            }
        ]
    },
    'Cucumber': {
        duration: { min: 60, max: 75, unit: 'days' },
        category: 'vegetable',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -10,
                duration: 10,
                activities: [
                    { task: '2-3 ploughings', day: 0 },
                    { task: 'Add 8-10 trolleys FYM', day: 5 },
                    { task: 'Make pits 2x2x1.5 feet', day: 8 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 5,
                activities: [
                    { task: 'Soak seeds 6-8 hours', day: -1 },
                    { task: 'Sow 2-3 seeds per pit', day: 0 },
                    { task: 'Depth: 1 inch', day: 0 },
                    { task: 'Water immediately', day: 0 }
                ]
            },
            {
                name: 'Growth & Support',
                dayOffset: 10,
                duration: 25,
                activities: [
                    { task: 'Thinning at 10 days', day: 0 },
                    { task: 'Provide bower/stake support', day: 5 },
                    { task: 'First fertilizer (30 kg urea)', day: 10 },
                    { task: 'Train vines on support', day: 15 }
                ]
            },
            {
                name: 'Flowering',
                dayOffset: 35,
                duration: 15,
                activities: [
                    { task: 'Flowers appear (30-35 days)', day: 0 },
                    { task: 'Second fertilizer (25 kg urea)', day: 5 },
                    { task: 'Control fruit fly with traps', day: 10 }
                ]
            },
            {
                name: 'Harvesting',
                dayOffset: 50,
                duration: 35,
                activities: [
                    { task: 'First harvest at 45-50 days', day: 0 },
                    { task: 'Pick every 2-3 days', day: 3 },
                    { task: 'Third fertilizer (20 kg urea)', day: 15 },
                    { task: 'Continue 12-15 pickings', day: 30 }
                ]
            }
        ]
    },
    'Cotton': {
        duration: { min: 150, max: 180, unit: 'days' },
        category: 'fiber',
        stages: [
            {
                name: 'Land Preparation',
                dayOffset: -30,
                duration: 30,
                activities: [
                    { task: 'Summer ploughing (12 inches deep)', day: 0 },
                    { task: '2-3 pre-sowing ploughings', day: 15 },
                    { task: 'Apply 8-10 trolleys FYM/acre', day: 20 }
                ]
            },
            {
                name: 'Sowing',
                dayOffset: 0,
                duration: 5,
                activities: [
                    { task: 'Seed treatment with fungicide + insecticide', day: -1 },
                    { task: 'Seed rate: 800g-1kg/acre (Bt)', day: 0 },
                    { task: 'Spacing: 75-90x30-45 cm', day: 0 },
                    { task: 'Depth: 2-3 inches', day: 0 }
                ]
            },
            {
                name: 'Early Growth',
                dayOffset: 15,
                duration: 45,
                activities: [
                    { task: 'Gap filling at 15-20 days', day: 0 },
                    { task: 'Thinning - one plant per spot', day: 5 },
                    { task: 'First weeding at 20-25 days', day: 10 },
                    { task: 'First nitrogen application', day: 20 },
                    { task: 'Second weeding at 40 days', day: 25 }
                ]
            },
            {
                name: 'Flowering',
                dayOffset: 60,
                duration: 45,
                activities: [
                    { task: 'Flowering starts', day: 0 },
                    { task: 'Second nitrogen application', day: 15 },
                    { task: 'Watch for bollworm', day: 20 },
                    { task: 'Spray as needed', day: 25 }
                ]
            },
            {
                name: 'Boll Development',
                dayOffset: 105,
                duration: 45,
                activities: [
                    { task: 'Bolls developing', day: 0 },
                    { task: 'Continue pest monitoring', day: 15 },
                    { task: 'Stop irrigation before picking', day: 30 }
                ]
            },
            {
                name: 'Picking',
                dayOffset: 150,
                duration: 45,
                activities: [
                    { task: 'First picking - fully opened bolls', day: 0 },
                    { task: 'Second picking after 15-20 days', day: 20 },
                    { task: 'Third picking', day: 35 }
                ]
            }
        ]
    }
};

module.exports = CROP_SCHEDULES;

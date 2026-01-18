const FarmSetup = require('../models/FarmSetup');
const Farmer = require('../models/Farmer');

/* =========================================================
   FARM CAPACITY LOGIC - COMBINED ALLOCATION VERSION
   
   🔥 NEW APPROACH: COMBINED SPACE CALCULATION
   
   When multiple animal types are selected together:
   - Calculate space based on COMBINATION, not individual limits
   - NO land share percentage limits for cows and goats
   - NO welfare caps for cows and goats (unlimited!)
   - Only constrained by:
     1. Total usable area
     2. Density rules (animals per cent)
     3. Welfare caps (hen & fish only)
   
   Example (30 cents):
   - Cows alone: limited by density only
   - Goats alone: limited by density only
   - Cows + Goats: use ALL available space optimally
   
   Allocation Strategy:
   - Distribute usable land proportionally based on selection
   - No artificial percentage caps
   - No welfare caps for cows/goats
   - Maximize farm utilization
========================================================= */

// ================= CONSTANTS =================
const SQFT_PER_CENT = 435.6;
const UTILITY_PERCENT = 0.25; // pathways, storage, movement

// Space needed per animal (sq ft)
const SPACE = {
    cow: 150,
    goat: 20,
    hen: 3,
};

// Density rule (animals per cent of total land)
const DENSITY = {
    cow: 0.75,
    goat: 2.5,
    hen: 30,
    fish: 120,
};

// Absolute welfare caps (only for hen and fish)
const WELFARE_CAP = {
    hen: 800,
    fish: 6000,
};

// Fish pond allocation (separate from land animals)
const FISH_POND_PERCENT = 0.25; // 25% of total area

// Profit per unit per month (in INR)
const PROFIT_PER_UNIT = {
    hen: 50,
    goat: 500,
    cow: 3000,
    fish: 20,
};

// Seasonal suitability data
const SEASONAL_SUITABILITY = {
    hen: {
        summer: { suitability: 'medium', notes: 'Need proper ventilation and cooling' },
        monsoon: { suitability: 'medium', notes: 'Maintain dry conditions in shed' },
        winter: { suitability: 'high', notes: 'Ideal temperature for egg production' },
        'post-monsoon': { suitability: 'high', notes: 'Good conditions for poultry' },
    },
    goat: {
        summer: { suitability: 'high', notes: 'Goats adapt well, ensure shade and water' },
        monsoon: { suitability: 'medium', notes: 'Keep shelter dry, watch for infections' },
        winter: { suitability: 'high', notes: 'Excellent breeding season' },
        'post-monsoon': { suitability: 'high', notes: 'Good grazing conditions' },
    },
    cow: {
        summer: { suitability: 'medium', notes: 'Provide shade and ample water' },
        monsoon: { suitability: 'medium', notes: 'Maintain hygiene to prevent diseases' },
        winter: { suitability: 'high', notes: 'Peak milk production season' },
        'post-monsoon': { suitability: 'high', notes: 'Good fodder availability' },
    },
    fish: {
        summer: { suitability: 'low', notes: 'Water levels may drop, monitor oxygen' },
        monsoon: { suitability: 'high', notes: 'Best season for fish farming' },
        winter: { suitability: 'medium', notes: 'Growth rate may slow down' },
        'post-monsoon': { suitability: 'high', notes: 'Excellent for harvesting' },
    },
};

// Get current season based on month
const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    if (month >= 10 && month <= 11) return 'post-monsoon';
    return 'winter';
};

// ================= COMBINED CAPACITY CALCULATION =================
const calculateCapacity = (landSizeCents, farmingTypes) => {
    if (!landSizeCents || landSizeCents <= 10 || landSizeCents >= 100) {
        throw new Error('Land must be greater than 10 and less than 100 cents');
    }

    const totalArea = landSizeCents * SQFT_PER_CENT;
    const utilityArea = totalArea * UTILITY_PERCENT;
    const usableArea = totalArea - utilityArea;

    const capacity = {};
    const warnings = [];
    const constraints = {};

    // Check if fish is selected
    const hasFish = farmingTypes.includes('fish');
    
    // Fish pond area (separate allocation)
    const fishPondArea = hasFish ? (totalArea * FISH_POND_PERCENT) : 0;
    
    // Remaining area for land animals
    let remainingArea = usableArea;

    // Filter land animals (exclude fish)
    const landAnimals = farmingTypes.filter(type => type !== 'fish');
    
    // ================= COMBINED ALLOCATION STRATEGY =================
    if (landAnimals.length > 0) {
        // Calculate total space weight for proportional distribution
        const spaceWeights = {
            cow: SPACE.cow,
            goat: SPACE.goat,
            hen: SPACE.hen,
        };

        // For each land animal type selected
        landAnimals.forEach(type => {
            // 🔐 CONSTRAINT 1: Max by density rule (per cent of total land)
            const maxByDensity = Math.floor(landSizeCents * DENSITY[type]);

            // 🔐 CONSTRAINT 2: Max by available usable area
            // Divide remaining area among selected animals proportionally
            const proportionalShare = remainingArea / landAnimals.length;
            const maxByArea = Math.floor(proportionalShare / SPACE[type]);

            // 🔐 CONSTRAINT 3: Max by welfare cap (only for hen)
            const maxByWelfare = WELFARE_CAP[type] || Infinity;

            // ✅ FINAL COUNT: Minimum of all constraints (NO LAND SHARE LIMIT, NO WELFARE CAP FOR COW/GOAT)
            const finalCount = Math.min(
                maxByArea,
                maxByDensity,
                maxByWelfare
            );

            if (finalCount <= 0) {
                warnings.push(`${type.charAt(0).toUpperCase() + type.slice(1)} not feasible with current land allocation`);
                return;
            }

            // Calculate actual area used
            const areaUsed = finalCount * SPACE[type];
            remainingArea -= areaUsed;

            // Track which constraint was the limiting factor
            const limitingFactors = [];
            if (finalCount === maxByArea) limitingFactors.push('available area');
            if (finalCount === maxByDensity) limitingFactors.push('density rule');
            if (WELFARE_CAP[type] && finalCount === maxByWelfare) limitingFactors.push('welfare cap');

            constraints[type] = {
                maxByArea,
                maxByDensity,
                ...(WELFARE_CAP[type] ? { maxByWelfare } : {}),
                finalCount,
                limitingFactors,
            };

            // Build capacity object with detailed breakdown
            if (type === 'cow') {
                capacity.cow = {
                    count: finalCount,
                    areaUsed: Math.round(areaUsed),
                    landSharePercent: Math.round((areaUsed / usableArea) * 100),
                    shedArea: Math.round(areaUsed * 0.50),
                    milkingArea: Math.round(areaUsed * 0.25),
                    fodderStorage: Math.round(areaUsed * 0.25),
                };
            } else if (type === 'goat') {
                capacity.goat = {
                    count: finalCount,
                    areaUsed: Math.round(areaUsed),
                    landSharePercent: Math.round((areaUsed / usableArea) * 100),
                    shedArea: Math.round(areaUsed * 0.30),
                    grazingArea: Math.round(areaUsed * 0.50),
                    waterFeedArea: Math.round(areaUsed * 0.20),
                };
            } else if (type === 'hen') {
                capacity.hen = {
                    count: finalCount,
                    areaUsed: Math.round(areaUsed),
                    landSharePercent: Math.round((areaUsed / usableArea) * 100),
                    shedArea: Math.round(areaUsed * 0.60),
                    feedArea: Math.round(areaUsed * 0.25),
                    eggCollectionArea: Math.round(areaUsed * 0.15),
                };
            }

            // Add constraint warnings
            if (limitingFactors.length > 0) {
                warnings.push(`${type.charAt(0).toUpperCase() + type.slice(1)}: limited by ${limitingFactors.join(' & ')} (${finalCount} animals)`);
            }
        });
    }

    // ================= FISH (Separate allocation from total area) =================
    if (hasFish) {
        const pondArea = fishPondArea;
        
        // Max by density rule (based on total land)
        const maxFishByDensity = Math.floor(landSizeCents * DENSITY.fish);
        
        // Max by pond area (1 fish per 10 sq ft for sustainable farming)
        const maxFishByArea = Math.floor(pondArea / 10);
        
        // Apply welfare cap
        const estimatedFish = Math.min(
            maxFishByArea,
            maxFishByDensity,
            WELFARE_CAP.fish
        );

        if (estimatedFish > 0) {
            capacity.fish = {
                pondArea: Math.round(pondArea),
                pondSizeCents: Math.round((pondArea / SQFT_PER_CENT) * 10) / 10,
                pondDepth: 5,
                fishTypes: ['Rohu', 'Catla', 'Tilapia'],
                estimatedFishCount: estimatedFish,
            };
            
            constraints.fish = {
                maxByArea: maxFishByArea,
                maxByDensity: maxFishByDensity,
                maxByWelfare: WELFARE_CAP.fish,
                finalCount: estimatedFish,
            };

            if (estimatedFish === maxFishByDensity && maxFishByDensity < maxFishByArea) {
                warnings.push(`Fish: limited by density rule (${estimatedFish} fish)`);
            }
        } else {
            warnings.push('Fish farming not feasible for selected land size');
        }
    }

    // Calculate totals
    const totalAnimalAreaUsed = Object.values(capacity)
        .filter(c => c.areaUsed)
        .reduce((sum, c) => sum + c.areaUsed, 0);

    return {
        capacity,
        areaBreakdown: {
            totalArea: Math.round(totalArea),
            totalLandCents: landSizeCents,
            utilityArea: Math.round(utilityArea),
            usableArea: Math.round(usableArea),
            totalAnimalAreaUsed: Math.round(totalAnimalAreaUsed),
            remainingLandArea: Math.round(remainingArea),
            fishPondArea: Math.round(fishPondArea),
            landUtilization: Math.round((totalAnimalAreaUsed / usableArea) * 100),
        },
        constraints,
        warnings,
    };
};

// ================= CALCULATE PROFIT =================
const calculateProfit = (capacityData, farmingTypes) => {
    const { capacity } = capacityData;
    const monthly = { total: 0 };
    const annual = { total: 0 };

    if (capacity.hen && capacity.hen.count > 0) {
        monthly.hen = capacity.hen.count * PROFIT_PER_UNIT.hen;
        annual.hen = monthly.hen * 12;
        monthly.total += monthly.hen;
    }

    if (capacity.goat && capacity.goat.count > 0) {
        monthly.goat = capacity.goat.count * PROFIT_PER_UNIT.goat;
        annual.goat = monthly.goat * 12;
        monthly.total += monthly.goat;
    }

    if (capacity.cow && capacity.cow.count > 0) {
        monthly.cow = capacity.cow.count * PROFIT_PER_UNIT.cow;
        annual.cow = monthly.cow * 12;
        monthly.total += monthly.cow;
    }

    if (capacity.fish && capacity.fish.estimatedFishCount > 0) {
        monthly.fish = capacity.fish.estimatedFishCount * PROFIT_PER_UNIT.fish;
        annual.fish = monthly.fish * 12;
        monthly.total += monthly.fish;
    }

    annual.total = monthly.total * 12;

    return { monthly, annual };
};

// ================= SEASONAL RECOMMENDATIONS =================
const getSeasonalRecommendations = (farmingTypes) => {
    const currentSeason = getCurrentSeason();
    const recommendations = [];

    farmingTypes.forEach(type => {
        if (SEASONAL_SUITABILITY[type] && SEASONAL_SUITABILITY[type][currentSeason]) {
            const seasonData = SEASONAL_SUITABILITY[type][currentSeason];
            recommendations.push({
                farmingType: type,
                season: currentSeason,
                suitability: seasonData.suitability,
                notes: seasonData.notes,
            });
        }
    });

    return recommendations;
};

// ================= WASTE REUSE =================
const calculateWasteReuse = (capacityData, farmingTypes) => {
    const { capacity } = capacityData;
    const hasCow = farmingTypes.includes('cow') && capacity.cow?.count > 0;
    const hasFish = farmingTypes.includes('fish') && capacity.fish?.estimatedFishCount > 0;

    const wasteReuse = {
        hasBiogas: hasCow && capacity.cow.count >= 2,
        biogasCapacity: hasCow ? Math.floor(capacity.cow.count * 2) : 0,
        slurryForFertilizer: hasCow,
        slurryForFishPond: hasCow && hasFish,
        notes: '',
    };

    if (wasteReuse.hasBiogas) {
        wasteReuse.notes = 'Cow dung can generate biogas for cooking. ';
    }
    if (wasteReuse.slurryForFishPond) {
        wasteReuse.notes += 'Biogas slurry can enrich fish pond with natural plankton, reducing feed costs by 20-30%.';
    } else if (wasteReuse.slurryForFertilizer) {
        wasteReuse.notes += 'Biogas slurry can be used as organic fertilizer.';
    }

    return wasteReuse;
};

// ================= WATER REQUIREMENT =================
const calculateWaterRequirement = (capacityData, farmingTypes) => {
    const { capacity } = capacityData;
    let dailyLiters = 0;

    if (capacity.hen) dailyLiters += capacity.hen.count * 0.25;
    if (capacity.goat) dailyLiters += capacity.goat.count * 5;
    if (capacity.cow) dailyLiters += capacity.cow.count * 50;
    if (capacity.fish && capacity.fish.estimatedFishCount > 0) {
        const pondVolumeLiters = capacity.fish.pondArea * capacity.fish.pondDepth * 28.3168;
        dailyLiters += Math.round(pondVolumeLiters * 0.05);
    }

    let level = 'low';
    if (dailyLiters > 500) level = 'high';
    else if (dailyLiters > 200) level = 'moderate';

    return { level, dailyLiters: Math.round(dailyLiters) };
};

// ================= MAINTENANCE LEVEL =================
const calculateMaintenanceLevel = (farmingTypes, capacityData) => {
    const { capacity } = capacityData;
    let score = 0;

    if (farmingTypes.includes('cow')) score += 3;
    if (farmingTypes.includes('fish')) score += 2;
    if (farmingTypes.includes('goat')) score += 2;
    if (farmingTypes.includes('hen')) score += 1;

    const totalAnimals = (capacity.hen?.count || 0) +
        (capacity.goat?.count || 0) * 5 +
        (capacity.cow?.count || 0) * 10;

    if (totalAnimals > 500) score += 2;
    else if (totalAnimals > 200) score += 1;

    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
};

// ================= AI VISUALIZATION PROMPT =================
const generateVisualizationPrompt = (landSize, farmingTypes, capacityData) => {
    const { capacity } = capacityData;
    const typeDescriptions = [];

    if (capacity.hen && capacity.hen.count > 0) {
        typeDescriptions.push(`a poultry shed for ${capacity.hen.count} hens with feeding area and egg collection zone`);
    }
    if (capacity.goat && capacity.goat.count > 0) {
        typeDescriptions.push(`a raised goat shelter for ${capacity.goat.count} goats with open grazing area`);
    }
    if (capacity.cow && capacity.cow.count > 0) {
        typeDescriptions.push(`a cattle shed for ${capacity.cow.count} cows with milking area and fodder storage`);
    }
    if (capacity.fish && capacity.fish.estimatedFishCount > 0) {
        typeDescriptions.push(`a fish pond covering ${capacity.fish.pondSizeCents} cents with water inlet and outlet for ${capacity.fish.fishTypes.join(', ')}`);
    }

    return `Generate a realistic 3D AI visualization of an agriculture farm setup:
- Total land: ${landSize} cents
- Location: Rural Indian agricultural land
- Zones: ${typeDescriptions.join('; ')}
- Layout: Optimized mixed farming layout with shared land allocation${capacity.fish ? ', fish pond in separate section' : ''}
- Style: Clean, practical, farmer-friendly layout with clear labels
- Include: Natural surroundings (trees, soil, fencing), pathways, water sources
- View: Aerial + side-view mixed layout, eco-friendly design suitable for small-scale Indian farmers`;
};

// ================= MAIN CONTROLLER =================

// @desc    Calculate farm setup
// @route   POST /api/farm-setup/calculate
// @access  Private
const calculateFarmSetup = async (req, res, next) => {
    try {
        const { landSize, farmingTypes } = req.body;

        // Validation
        if (!landSize || landSize <= 10 || landSize >= 100) {
            return res.status(400).json({
                success: false,
                message: 'Land must be greater than 10 cents and less than 100 cents',
            });
        }

        if (!farmingTypes || !Array.isArray(farmingTypes) || farmingTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one farming type',
            });
        }

        const validTypes = ['hen', 'goat', 'cow', 'fish'];
        const invalidTypes = farmingTypes.filter(t => !validTypes.includes(t));
        if (invalidTypes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid farming types: ${invalidTypes.join(', ')}`,
            });
        }

        // Calculate everything
        const capacityData = calculateCapacity(landSize, farmingTypes);
        const profitEstimate = calculateProfit(capacityData, farmingTypes);
        const seasonalRecommendations = getSeasonalRecommendations(farmingTypes);
        const wasteReuseFlow = calculateWasteReuse(capacityData, farmingTypes);
        const waterRequirement = calculateWaterRequirement(capacityData, farmingTypes);
        const maintenanceLevel = calculateMaintenanceLevel(farmingTypes, capacityData);
        const visualizationPrompt = generateVisualizationPrompt(landSize, farmingTypes, capacityData);

        res.json({
            success: true,
            data: {
                landSize,
                landSizeSqFt: capacityData.areaBreakdown.totalArea,
                areaBreakdown: capacityData.areaBreakdown,
                farmingTypes,
                calculatedCapacity: capacityData.capacity,
                constraints: capacityData.constraints,
                profitEstimate,
                seasonalRecommendations,
                wasteReuseFlow,
                waterRequirement,
                maintenanceLevel,
                visualizationPrompt,
                warnings: capacityData.warnings,
                currentSeason: getCurrentSeason(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Save farm setup
// @route   POST /api/farm-setup
// @access  Private
const saveFarmSetup = async (req, res, next) => {
    try {
        const farmSetup = await FarmSetup.create({
            user: req.user.id,
            ...req.body,
        });

        res.status(201).json({
            success: true,
            data: farmSetup,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get farm setup history
// @route   GET /api/farm-setup/history
// @access  Private
const getFarmSetupHistory = async (req, res, next) => {
    try {
        const setups = await FarmSetup.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: setups,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get farm setup by ID
// @route   GET /api/farm-setup/:id
// @access  Private
const getFarmSetupById = async (req, res, next) => {
    try {
        const setup = await FarmSetup.findById(req.params.id);

        if (!setup) {
            return res.status(404).json({
                success: false,
                message: 'Farm setup not found',
            });
        }

        if (setup.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this setup',
            });
        }

        res.json({
            success: true,
            data: setup,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    calculateFarmSetup,
    saveFarmSetup,
    getFarmSetupHistory,
    getFarmSetupById,
};

/* ================= EXAMPLES WITH COMBINED ALLOCATION =================

30 CENTS EXAMPLE:
- Total area: 13,068 sq ft
- Usable area (75%): 9,801 sq ft

COMBINED ALLOCATION (NO PERCENTAGE LIMITS, NO WELFARE CAPS FOR COW/GOAT):
✅ Cows + Goats (30 cents):
   - Usable area: 9,801 sq ft
   - Divided equally: 4,900.5 sq ft per type
   - Cows: 4,900 / 150 = 32 cows (limited by density: 30 * 0.75 = 22 cows) ✅
   - Goats: 4,900 / 20 = 245 goats (limited by density: 30 * 2.5 = 75 goats) ✅
   - RESULT: 22 cows + 75 goats ✅

✅ Cows + Goats + Hens (30 cents):
   - Divided into 3: ~3,267 sq ft per type
   - Cows: 3,267 / 150 = 21 cows (limited by density: 22 cows max) ✅
   - Goats: 3,267 / 20 = 163 goats (limited by density: 75 goats max) ✅
   - Hens: 3,267 / 3 = 1,089 hens (limited by welfare: 800 hens) ✅
   - RESULT: 21 cows + 75 goats + 800 hens ✅

40 CENTS EXAMPLE:
✅ Cows + Goats (40 cents):
   - Usable area: 13,068 sq ft
   - Divided equally: 6,534 sq ft per type
   - Cows: 6,534 / 150 = 43 cows (limited by density: 40 * 0.75 = 30 cows) ✅
   - Goats: 6,534 / 20 = 326 goats (limited by density: 40 * 2.5 = 100 goats) ✅
   - RESULT: 30 cows + 100 goats ✅

50 CENTS EXAMPLE:
✅ Cows + Goats (50 cents):
   - Usable area: 16,335 sq ft
   - Divided equally: 8,167.5 sq ft per type
   - Cows: 8,167 / 150 = 54 cows (limited by density: 50 * 0.75 = 37 cows) ✅
   - Goats: 8,167 / 20 = 408 goats (limited by density: 50 * 2.5 = 125 goats) ✅
   - RESULT: 37 cows + 125 goats ✅

KEY CHANGES:
1. ❌ Removed LAND_SHARE limits (45%, 30%, 25%)
2. ❌ Removed PRIORITY allocation order
3. ❌ Removed WELFARE_CAP for cows and goats (unlimited based on density & space)
4. ✅ Equal distribution of usable area among selected types
5. ✅ Only limited by: density rules, available area, and welfare caps (hen & fish only)
6. ✅ Maximum utilization of available land
======================================================= */
const MarketPrice = require('../models/MarketPrice');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

/**
 * Scrape Kerala vegetable prices from Ecostat
 * Table Structure (verified via browser):
 * Column 0: Date (dd/mm/yyyy)
 * Column 1: Item (e.g. "Onion big (Kg.)")
 * Column 2: Price(AVG) (e.g. "36.07")
 * Column 3: Price Unit (e.g. "Rs.")
 * Column 4-9: Previous day/month/year comparisons
 */
const scrapeKeralaMarketPrices = async () => {
    try {
        console.log('🔄 Starting Kerala Ecostat market price scraping...');

        const response = await axios.get('https://ecostat.kerala.gov.in/data-subset/474', {
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });

        const $ = cheerio.load(response.data);
        const prices = [];

        // Find the main data table (class="w-full" as per browser inspection)
        const $table = $('table.w-full').first();

        if ($table.length === 0) {
            console.error('❌ No table with class "w-full" found. Trying fallback...');
            // Fallback: try any table
            const $fallbackTable = $('table').first();
            if ($fallbackTable.length === 0) {
                console.error('❌ No tables found on page at all.');
                return null;
            }
        }

        // Use tbody tr for data rows
        $table.find('tbody tr').each((index, row) => {
            const cols = $(row).find('td');

            if (cols.length >= 4) {
                // Column 0: Date (dd/mm/yyyy format)
                const dateStr = $(cols[0]).text().trim();
                // Column 1: Item name (e.g. "Onion big (Kg.)")
                const itemName = $(cols[1]).text().trim();
                // Column 2: Average Price (Today)
                const priceText = $(cols[2]).text().trim();
                // Column 3: Price Unit (Rs.)
                const priceUnit = $(cols[3]).text().trim();
                // Column 4: Previous Day Price (if available)
                const prevDayPriceText = cols.length > 4 ? $(cols[4]).text().trim() : '';

                // DEBUG: Log all columns for first 3 rows
                if (index < 3) {
                    console.log(`\n--- Row ${index} Debug ---`);
                    console.log(`Total columns: ${cols.length}`);
                    for (let i = 0; i < Math.min(cols.length, 10); i++) {
                        console.log(`  Col ${i}: "${$(cols[i]).text().trim()}"`);
                    }
                    console.log(`Item: ${itemName}`);
                    console.log(`Today Price: ${priceText}`);
                    console.log(`Prev Day Text: "${prevDayPriceText}"`);
                }

                // Parse date (Indian format: dd/mm/yyyy)
                let parsedDate = new Date();
                if (dateStr) {
                    const [day, month, year] = dateStr.split('/');
                    if (day && month && year) {
                        parsedDate = new Date(`${year}-${month}-${day}`);
                    }
                }

                // Parse today's price
                const priceValue = parseFloat(priceText.replace(/[^\d.]/g, ''));
                // Parse previous day's price
                const prevDayPrice = parseFloat(prevDayPriceText.replace(/[^\d.]/g, ''));

                // Clean item name: remove "(Kg.)" or "(No.)" from end for display, keep original for context
                const cleanName = itemName.replace(/\s*\(.*?\)\s*$/g, '').trim();
                const unit = itemName.match(/\((.*?)\)/)?.[1] || 'Kg';

                // Calculate price change and trend
                let priceChange = { value: 0, percentage: 0, trend: 'stable' };

                if (!isNaN(prevDayPrice) && prevDayPrice > 0 && !isNaN(priceValue)) {
                    const priceDiff = priceValue - prevDayPrice;
                    const percentageChange = ((priceDiff / prevDayPrice) * 100);

                    let trend = 'stable';
                    if (priceValue > prevDayPrice) {
                        trend = 'up';  // Today's price is HIGHER than yesterday = INCREASE
                    } else if (priceValue < prevDayPrice) {
                        trend = 'down';  // Today's price is LOWER than yesterday = DECREASE
                    }

                    priceChange = {
                        value: parseFloat(priceDiff.toFixed(2)),
                        percentage: parseFloat(percentageChange.toFixed(2)),
                        trend: trend
                    };

                    // Log successful price change calculation
                    if (index < 3) { // Log first 3 items for debugging
                        console.log(`✓ ${cleanName}: Today ₹${priceValue}, Yesterday ₹${prevDayPrice}, Change: ${percentageChange.toFixed(2)}%, Trend: ${trend}`);
                    }
                } else {
                    // Log when previous day price is missing
                    if (index < 3) {
                        console.log(`⚠ ${cleanName}: No prev day price (prevDayPriceText: "${prevDayPriceText}", parsed: ${prevDayPrice})`);
                    }
                }

                if (cleanName && !isNaN(priceValue) && priceValue > 0) {
                    prices.push({
                        commodity: cleanName,
                        market: {
                            name: 'Kerala State Average',
                            type: 'retail',
                            location: { state: 'Kerala' }
                        },
                        price: {
                            modal: priceValue,
                            unit: `${priceUnit || 'Rs'}/${unit}`
                        },
                        date: parsedDate,
                        source: 'ecostat.kerala.gov.in',
                        priceChange: priceChange
                    });
                }
            }
        });

        console.log(`✅ Successfully scraped ${prices.length} vegetable prices from Ecostat.`);
        return prices;
    } catch (error) {
        console.error('❌ Scraping error:', error.message);
        return null;
    }
};

/**
 * Calculate price changes by comparing today's prices with yesterday's prices
 * If today's price > yesterday's price => trend is 'up' (increase)
 * If today's price < yesterday's price => trend is 'down' (decrease)
 */
const calculatePriceChanges = async (todayPrices) => {
    try {
        // Get yesterday's date range
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        // Fetch yesterday's prices from database
        const yesterdayPrices = await MarketPrice.find({
            date: { $gte: yesterday, $lte: yesterdayEnd },
            source: 'ecostat.kerala.gov.in'
        });

        // Create a map for quick lookup
        const yesterdayPriceMap = {};
        yesterdayPrices.forEach(item => {
            yesterdayPriceMap[item.commodity.toLowerCase()] = item.price.modal;
        });

        // Calculate changes for each today's price
        return todayPrices.map(item => {
            const commodityKey = item.commodity.toLowerCase();
            const yesterdayPrice = yesterdayPriceMap[commodityKey];

            if (yesterdayPrice && yesterdayPrice > 0) {
                const todayPrice = item.price.modal;
                const priceDiff = todayPrice - yesterdayPrice;
                const percentageChange = ((priceDiff / yesterdayPrice) * 100).toFixed(2);

                let trend = 'stable';
                if (todayPrice > yesterdayPrice) {
                    trend = 'up';  // Today's price is higher = increase
                } else if (todayPrice < yesterdayPrice) {
                    trend = 'down';  // Today's price is lower = decrease
                }

                item.priceChange = {
                    value: parseFloat(priceDiff.toFixed(2)),
                    percentage: parseFloat(percentageChange),
                    trend: trend
                };
            }

            return item;
        });
    } catch (error) {
        console.error('Error calculating price changes:', error);
        return todayPrices;
    }
};

// Schedule Daily Update (Runs at 10:00 AM every day)
const schedulePriceUpdates = () => {
    cron.schedule('0 10 * * *', async () => {
        console.log('Running daily market price update...');
        const scrapedPrices = await scrapeKeralaMarketPrices();
        if (scrapedPrices && scrapedPrices.length > 0) {
            try {
                // Determine today's date range
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                // Check duplicates to avoid flooding
                const existingCount = await MarketPrice.countDocuments({
                    date: { $gte: startOfDay, $lte: endOfDay },
                    source: 'ecostat.kerala.gov.in'
                });

                if (existingCount === 0) {
                    await MarketPrice.insertMany(scrapedPrices);
                    console.log('Daily prices updated successfully.');
                } else {
                    console.log('Prices for today already exist. Skipping insertion.');
                }
            } catch (err) {
                console.error('Error saving scheduled prices:', err);
            }
        }
    });
};

// @desc    Get today's market prices
// @route   GET /api/market/today
// @access  Public
const getTodayPrices = async (req, res, next) => {
    try {
        const { state = 'Kerala' } = req.query;

        // Try to get today's prices from database first
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let prices = await MarketPrice.find({
            'market.location.state': state,
            date: { $gte: today },
        }).sort({ commodity: 1 });

        // If no cached prices, fetch from Ecostat (no mock fallback)
        if (prices.length === 0) {
            let scrapedPrices = await scrapeKeralaMarketPrices();

            if (!scrapedPrices || scrapedPrices.length === 0) {
                return res.status(503).json({
                    success: false,
                    message: 'Unable to fetch live prices from Kerala Ecostat. Please try again later.',
                    data: { prices: [], lastUpdated: null, state }
                });
            }

            // DON'T call calculatePriceChanges - the scraper already calculated 
            // price changes from column 4 of the Ecostat table

            // Save to database
            prices = await MarketPrice.insertMany(scrapedPrices);
        }

        // Return prices directly - priceChange already exists from scraper
        // DON'T call calculatePriceChanges which would overwrite with zeros
        const pricesData = prices.map(p => p.toObject ? p.toObject() : p);

        res.json({
            success: true,
            data: {
                prices: pricesData,
                lastUpdated: prices[0]?.createdAt || new Date(),
                state,
                source: 'ecostat.kerala.gov.in'
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get price history for a commodity
// @route   GET /api/market/history/:commodity
// @access  Public
const getPriceHistory = async (req, res, next) => {
    try {
        const { commodity } = req.params;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        let history = await MarketPrice.find({
            commodity: { $regex: commodity, $options: 'i' },
            date: { $gte: startDate },
        }).sort({ date: 1 });

        // If no history, generate mock data
        if (history.length === 0) {
            history = [];
            let basePrice = 30 + Math.random() * 20;
            for (let i = parseInt(days); i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                basePrice = basePrice * (0.95 + Math.random() * 0.1);
                history.push({
                    commodity,
                    price: { modal: Math.round(basePrice * 100) / 100 },
                    date,
                });
            }
        }

        res.json({
            success: true,
            data: {
                commodity,
                history,
                days: parseInt(days),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get best market to sell
// @route   GET /api/market/best/:commodity
// @access  Public
const getBestMarket = async (req, res, next) => {
    try {
        const { commodity } = req.params;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prices = await MarketPrice.find({
            commodity: { $regex: commodity, $options: 'i' },
            date: { $gte: today },
        }).sort({ 'price.modal': -1 }).limit(5);

        res.json({
            success: true,
            data: {
                commodity,
                bestMarkets: prices.length > 0 ? prices : [
                    {
                        market: { name: 'Ernakulam Market', type: 'wholesale', location: { state: 'Kerala', city: 'Ernakulam' } },
                        price: { modal: 45, unit: 'Rs/kg' },
                        recommendation: 'Best price today',
                    },
                ],
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get price alerts
// @route   GET /api/market/alerts
// @access  Private
const getPriceAlerts = async (req, res, next) => {
    try {
        // Get commodities with significant price changes
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alerts = await MarketPrice.find({
            date: { $gte: today },
            'priceChange.percentage': { $gt: 10 },
        }).sort({ 'priceChange.percentage': -1 });

        res.json({
            success: true,
            data: alerts.map(a => ({
                commodity: a.commodity,
                priceChange: a.priceChange,
                currentPrice: a.price.modal,
                message: a.priceChange.trend === 'up'
                    ? `${a.commodity} price increased by ${Math.abs(a.priceChange.percentage)}%! Good time to sell.`
                    : `${a.commodity} price decreased by ${Math.abs(a.priceChange.percentage)}%. Consider waiting.`,
            })),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Force refresh prices from Ecostat
// @route   POST /api/market/refresh
// @access  Public (or can be protected)
const refreshPrices = async (req, res, next) => {
    try {
        console.log('📡 Manual price refresh triggered...');
        let scrapedPrices = await scrapeKeralaMarketPrices();

        if (!scrapedPrices || scrapedPrices.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch prices from Ecostat. Please try again later.',
            });
        }

        // DON'T call calculatePriceChanges - the scraper already calculated 
        // price changes from column 4 of the Ecostat table
        // Calling it would overwrite with zeros since we're about to delete old data

        // Clear ALL existing Ecostat data to prevent any duplicates
        await MarketPrice.deleteMany({
            source: 'ecostat.kerala.gov.in'
        });

        console.log('🗑️ Cleared old Ecostat prices');

        // Insert fresh prices with calculated changes from scraper
        const saved = await MarketPrice.insertMany(scrapedPrices);

        console.log(`✅ Inserted ${saved.length} fresh prices from Ecostat`);

        res.json({
            success: true,
            message: `Successfully refreshed ${saved.length} vegetable prices from Kerala Ecostat.`,
            data: {
                prices: saved,
                lastUpdated: new Date(),
                source: 'ecostat.kerala.gov.in'
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTodayPrices,
    getPriceHistory,
    getBestMarket,
    getPriceAlerts,
    schedulePriceUpdates,
    refreshPrices,
};

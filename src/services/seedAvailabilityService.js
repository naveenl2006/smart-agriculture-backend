const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');
const SeedDistrict = require('../models/SeedDistrict');
const SeedAvailability = require('../models/SeedAvailability');

// All 37 TN Districts with their government website IDs
const TN_DISTRICTS = [
    { districtId: 30, name: 'Ariyalur', nameTamil: 'அரியலூர்' },
    { districtId: 35, name: 'Chengalpattu', nameTamil: 'செங்கல்பட்டு' },
    { districtId: 11, name: 'Coimbatore', nameTamil: 'கோயம்புத்தூர்' },
    { districtId: 4, name: 'Cuddalore', nameTamil: 'கடலூர்' },
    { districtId: 12, name: 'Dharmapuri', nameTamil: 'தர்மபுரி' },
    { districtId: 22, name: 'Dindigul', nameTamil: 'திண்டுக்கல்' },
    { districtId: 10, name: 'Erode', nameTamil: 'ஈரோடு' },
    { districtId: 38, name: 'Kallakurichi', nameTamil: 'கள்ளக்குறிச்சி' },
    { districtId: 2, name: 'Kancheepuram', nameTamil: 'காஞ்சிபுரம்' },
    { districtId: 29, name: 'Kanyakumari', nameTamil: 'கன்னியாகுமரி' },
    { districtId: 15, name: 'Karur', nameTamil: 'கரூர்' },
    { districtId: 13, name: 'Krishnagiri', nameTamil: 'கிருஷ்ணகிரி' },
    { districtId: 21, name: 'Madurai', nameTamil: 'மதுரை' },
    { districtId: 39, name: 'Mayiladuthurai', nameTamil: 'மயிலாடுதுறை' },
    { districtId: 19, name: 'Nagapattinam', nameTamil: 'நாகப்பட்டினம்' },
    { districtId: 8, name: 'Namakkal', nameTamil: 'நாமக்கல்' },
    { districtId: 31, name: 'Nilgiris', nameTamil: 'நீலகிரி' },
    { districtId: 16, name: 'Perambalur', nameTamil: 'பெரம்பலூர்' },
    { districtId: 20, name: 'Pudukkottai', nameTamil: 'புதுக்கோட்டை' },
    { districtId: 25, name: 'Ramanathapuram', nameTamil: 'ராமநாதபுரம்' },
    { districtId: 36, name: 'Ranipet', nameTamil: 'ராணிப்பேட்டை' },
    { districtId: 9, name: 'Salem', nameTamil: 'சேலம்' },
    { districtId: 24, name: 'Sivagangai', nameTamil: 'சிவகங்கை' },
    { districtId: 34, name: 'Tenkasi', nameTamil: 'தென்காசி' },
    { districtId: 17, name: 'Thanjavur', nameTamil: 'தஞ்சாவூர்' },
    { districtId: 23, name: 'Theni', nameTamil: 'தேனி' },
    { districtId: 27, name: 'Thirunelveli', nameTamil: 'திருநெல்வேலி' },
    { districtId: 37, name: 'Thirupathur', nameTamil: 'திருப்பத்தூர்' },
    { districtId: 3, name: 'Thiruvallur', nameTamil: 'திருவள்ளூர்' },
    { districtId: 18, name: 'Thiruvarur', nameTamil: 'திருவாரூர்' },
    { districtId: 28, name: 'Thoothukudi', nameTamil: 'தூத்துக்குடி' },
    { districtId: 33, name: 'Tiruppur', nameTamil: 'திருப்பூர்' },
    { districtId: 7, name: 'Tiruvannamalai', nameTamil: 'திருவண்ணாமலை' },
    { districtId: 14, name: 'Trichy', nameTamil: 'திருச்சி' },
    { districtId: 6, name: 'Vellore', nameTamil: 'வேலூர்' },
    { districtId: 5, name: 'Villupuram', nameTamil: 'விழுப்புரம்' },
    { districtId: 26, name: 'Virudhunagar', nameTamil: 'விருதுநகர்' },
];

const BASE_URL = 'https://www.tnagrisnet.tn.gov.in/hhbm_public/welcome';

// Column mapping for seed varieties (based on government site table structure)
const SEED_COLUMNS = [
    'paddy', 'cholam', 'maize', 'cumbu', 'ragi', 'kudiraivali',
    'samai', 'varagu', 'thenai', 'redgram', 'blackgram', 'greengram',
    'groundnut', 'gingelly', 'cotton', 'sunflower', 'castor', 'horsegram',
    'cowpea', 'lablab', 'bengalgram', 'fieldbean', 'soyabean', 'onion',
    'coriander', 'other'
];

// Get Chrome executable path
const getChromePath = () => {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.CHROME_PATH,
    ];
    return paths.find(p => p && require('fs').existsSync(p)) || paths[0];
};

/**
 * Sync districts to database
 */
const syncDistricts = async () => {
    console.log('[SeedAvailability] Syncing districts...');
    try {
        for (const district of TN_DISTRICTS) {
            await SeedDistrict.findOneAndUpdate(
                { districtId: district.districtId },
                {
                    ...district,
                    url: `${BASE_URL}/aec_report/1/${district.districtId}`,
                    isActive: true,
                },
                { upsert: true, new: true }
            );
        }
        console.log(`[SeedAvailability] Synced ${TN_DISTRICTS.length} districts`);
        return { success: true, count: TN_DISTRICTS.length };
    } catch (error) {
        console.error('[SeedAvailability] District sync error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Scrape seed availability using Puppeteer (headless browser)
 * This handles JavaScript-rendered DataTables on the government site
 */
const scrapeDistrictSeedsWithPuppeteer = async (districtId) => {
    const district = TN_DISTRICTS.find(d => d.districtId === districtId);
    if (!district) {
        throw new Error(`District with ID ${districtId} not found`);
    }

    const url = `${BASE_URL}/aec_report/1/${districtId}`;
    console.log(`[SeedAvailability] Scraping ${district.name} with Puppeteer...`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: getChromePath(),
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for DataTable to render
        await page.waitForSelector('table', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Extra wait for DataTables

        // Extract table data
        const tableData = await page.evaluate(() => {
            const rows = [];
            const table = document.querySelector('.dataTables_scrollBody table') || document.querySelector('table');

            if (!table) return rows;

            const tableRows = table.querySelectorAll('tbody tr');
            tableRows.forEach(tr => {
                const cells = tr.querySelectorAll('td');
                if (cells.length >= 3) {
                    const row = {
                        sno: cells[0]?.innerText?.trim() || '',
                        blockName: cells[1]?.innerText?.trim() || '',
                        aecName: cells[2]?.innerText?.trim() || '',
                        seeds: {}
                    };

                    // Get seed values from remaining columns (starting from index 3)
                    const seedColumns = ['paddy', 'cholam', 'maize', 'cumbu', 'ragi', 'kudiraivali',
                        'samai', 'varagu', 'thenai', 'redgram', 'blackgram', 'greengram',
                        'groundnut', 'gingelly', 'cotton', 'sunflower', 'castor', 'horsegram',
                        'cowpea', 'lablab', 'bengalgram', 'fieldbean', 'soyabean', 'onion', 'coriander'];

                    for (let i = 3; i < cells.length && (i - 3) < seedColumns.length; i++) {
                        const value = parseInt(cells[i]?.innerText?.trim()) || 0;
                        row.seeds[seedColumns[i - 3]] = value;
                    }

                    // Skip "Total" row
                    if (row.blockName.toLowerCase() !== 'total' && row.aecName.toLowerCase() !== 'total') {
                        rows.push(row);
                    }
                }
            });

            return rows;
        });

        await browser.close();
        browser = null;

        console.log(`[SeedAvailability] Extracted ${tableData.length} rows from ${district.name}`);

        // Save to database
        const savedData = [];
        for (const row of tableData) {
            if (row.aecName) {
                const aecRecord = {
                    districtId: districtId,
                    districtName: district.name,
                    blockName: row.blockName || district.name,
                    aecName: row.aecName,
                    seeds: {
                        paddy: row.seeds.paddy || 0,
                        cholam: row.seeds.cholam || 0,
                        maize: row.seeds.maize || 0,
                        cumbu: row.seeds.cumbu || 0,
                        ragi: row.seeds.ragi || 0,
                        kudiraivali: row.seeds.kudiraivali || 0,
                        samai: row.seeds.samai || 0,
                        varagu: row.seeds.varagu || 0,
                        thenai: row.seeds.thenai || 0,
                        redgram: row.seeds.redgram || 0,
                        blackgram: row.seeds.blackgram || 0,
                        greengram: row.seeds.greengram || 0,
                        groundnut: row.seeds.groundnut || 0,
                        gingelly: row.seeds.gingelly || 0,
                        cotton: row.seeds.cotton || 0,
                        sunflower: row.seeds.sunflower || 0,
                        horsegram: row.seeds.horsegram || 0,
                        cowpea: row.seeds.cowpea || 0,
                        other: 0,
                    },
                    lastUpdated: new Date(),
                };

                await SeedAvailability.findOneAndUpdate(
                    { districtId: aecRecord.districtId, aecName: aecRecord.aecName },
                    aecRecord,
                    { upsert: true, new: true }
                );
                savedData.push(aecRecord);
            }
        }

        return { success: true, district: district.name, aecCount: savedData.length, data: savedData };
    } catch (error) {
        console.error(`[SeedAvailability] Puppeteer scrape error for ${district.name}:`, error.message);
        if (browser) await browser.close();
        return { success: false, district: district.name, error: error.message };
    }
};

/**
 * Get all districts
 */
const getDistricts = async () => {
    const count = await SeedDistrict.countDocuments();
    if (count === 0) {
        await syncDistricts();
    }
    return await SeedDistrict.find({ isActive: true }).sort({ name: 1 }).lean();
};

/**
 * Get seed availability by district name or ID
 */
const getSeedsByDistrict = async (districtQuery) => {
    let district;
    if (typeof districtQuery === 'number' || !isNaN(districtQuery)) {
        district = TN_DISTRICTS.find(d => d.districtId === parseInt(districtQuery));
    } else {
        district = TN_DISTRICTS.find(d =>
            d.name.toLowerCase() === districtQuery.toLowerCase()
        );
    }

    if (!district) {
        return { success: false, error: 'District not found', data: [] };
    }

    // Check for cached data
    const cachedData = await SeedAvailability.find({ districtId: district.districtId })
        .sort({ aecName: 1 })
        .lean();

    // Check if cached data has actual values (not all zeros)
    const hasRealData = cachedData.some(aec =>
        aec.seeds && Object.values(aec.seeds).some(v => v > 0)
    );

    // If no data or stale data (older than 6 hours), fetch fresh
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const isStale = cachedData.length > 0 && cachedData[0].lastUpdated < sixHoursAgo;

    if (cachedData.length === 0 || !hasRealData || isStale) {
        console.log(`[SeedAvailability] Fetching fresh data for ${district.name}...`);
        const result = await scrapeDistrictSeedsWithPuppeteer(district.districtId);
        if (result.success) {
            return {
                success: true,
                district: district,
                data: result.data,
                source: 'live'
            };
        }
        // Return cached data if scraping fails
        if (cachedData.length > 0) {
            return {
                success: true,
                district: district,
                data: cachedData,
                source: 'cached'
            };
        }
        return result;
    }

    return {
        success: true,
        district: district,
        data: cachedData,
        source: 'cached'
    };
};

/**
 * Sync all districts (for cron job)
 */
const syncAllDistricts = async () => {
    console.log('[SeedAvailability] Starting full sync with Puppeteer...');
    await syncDistricts();

    let successCount = 0;
    let failCount = 0;

    for (const district of TN_DISTRICTS) {
        try {
            const result = await scrapeDistrictSeedsWithPuppeteer(district.districtId);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
            // Delay between districts to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            failCount++;
            console.error(`[SeedAvailability] Error syncing ${district.name}:`, error.message);
        }
    }

    console.log(`[SeedAvailability] Full sync complete: ${successCount} success, ${failCount} failed`);
    return { success: true, successCount, failCount };
};

module.exports = {
    TN_DISTRICTS,
    syncDistricts,
    scrapeDistrictSeedsWithPuppeteer,
    getDistricts,
    getSeedsByDistrict,
    syncAllDistricts,
};

const axios = require('axios');
const cheerio = require('cheerio');
const GovernmentNews = require('../models/GovernmentNews');

// Important links data - since the website uses Angular with dynamic content,
// we'll use a curated list based on the official TN Agrisnet important links section
const IMPORTANT_LINKS = [
    {
        title: 'Beneficiary List 2022-23',
        titleTamil: 'பயனாளிகளின் பட்டியல் 2022-23',
        url: 'https://www.tnagrisnet.tn.gov.in/people_app_demo/bene',
        icon: '📋',
        category: 'farmers',
        order: 1,
    },
    {
        title: 'Free Tree Saplings Registration',
        titleTamil: 'இலவச மரக்கன்று முன்பதிவு',
        url: 'https://www.tnagrisnet.tn.gov.in/fcms/aaoVisit/#/agro/reg-tree',
        icon: '🌳',
        category: 'farmers',
        order: 2,
    },
    {
        title: 'Kuruvai Cultivation (ADA/AO/AAO)',
        titleTamil: 'குறுவை சாகுபடி (ADA/AO/AAO)',
        url: 'https://www.tnagrisnet.tn.gov.in/KSP/',
        icon: '🌾',
        category: 'officials',
        order: 3,
    },
    {
        title: 'Kuruvai Cultivation (PACCS)',
        titleTamil: 'குறுவை சாகுபடி (PACCS)',
        url: 'https://www.tnagrisnet.tn.gov.in/KSP/printCropPlan/#/paccs',
        icon: '🌾',
        category: 'officials',
        order: 4,
    },
    {
        title: 'Best Farmers Award',
        titleTamil: 'வேளாண்மையில் சிறப்பாக செயலாற்றும் விவசாயிகளுக்கு பரிசு',
        url: 'https://www.tnagrisnet.tn.gov.in/fcms/aaoVisit/#/agro/award',
        icon: '🏆',
        category: 'farmers',
        order: 5,
    },
    {
        title: 'Salient Statistics on Agriculture, 2021',
        titleTamil: 'வேளாண்மை பற்றிய முக்கிய புள்ளிவிபரங்கள், 2021',
        url: 'https://www.tnagrisnet.tn.gov.in/dashboard/book',
        icon: '📊',
        category: 'resources',
        order: 6,
    },
    {
        title: 'Crop Production Guide',
        titleTamil: 'பயிர் உற்பத்தி வழிகாட்டி',
        url: 'https://tnagriculture.in/dashboard/book/cpg',
        icon: '📖',
        category: 'resources',
        order: 7,
    },
    {
        title: 'PMFBY Premium',
        titleTamil: 'PMFBY பிரீமியம்',
        url: 'https://tnagriculture.in/bank_entry/',
        icon: '🛡️',
        category: 'schemes',
        order: 8,
    },
    {
        title: 'Uzhavan Login',
        titleTamil: 'உழவன் Login',
        url: 'https://www.tnagrisnet.tn.gov.in/people_app/',
        icon: '👨‍🌾',
        category: 'farmers',
        order: 9,
    },
    {
        title: 'Soil Atlas',
        titleTamil: 'மண் வரைபடம்',
        url: 'https://www.tnagrisnet.tn.gov.in/home/atlas/en',
        icon: '🗺️',
        category: 'resources',
        order: 10,
    },
    {
        title: 'Tamil Mannvalam',
        titleTamil: 'தமிழ் மண்வளம்',
        url: 'https://www.tnagrisnet.tn.gov.in/mannvalam/welcome/index/en',
        icon: '🌍',
        category: 'resources',
        order: 11,
    },
    {
        title: 'Benefit Registration',
        titleTamil: 'இடுபொருள் முன்பதிவு',
        url: 'https://www.tnagrisnet.tn.gov.in/KaviaDP/scheme_register',
        icon: '📝',
        category: 'schemes',
        order: 12,
    },
    {
        title: 'Seed Availability',
        titleTamil: 'விதை இருப்பு',
        url: 'https://www.tnagrisnet.tn.gov.in/hhbm_public/welcome/stock_position/1',
        icon: '🌱',
        category: 'resources',
        order: 13,
    },
    {
        title: 'Fertilizer Availability',
        titleTamil: 'உர இருப்பு',
        url: 'http://tnagriculture.in/ARS/fert_stock_position/index/en',
        icon: '🧪',
        category: 'resources',
        order: 14,
    },
    {
        title: 'Fertilizer Price',
        titleTamil: 'உர விலை நிலவரம்',
        url: 'http://115.243.209.84/people_app/fertilizer_price/index/en',
        icon: '💰',
        category: 'resources',
        order: 15,
    },
    {
        title: 'Pest Details',
        titleTamil: 'பூச்சி தாக்குதல் விவரங்கள்',
        url: 'https://www.tnagrisnet.tn.gov.in/home/pestDetails/',
        icon: '🐛',
        category: 'resources',
        order: 16,
    },
    {
        title: 'Disease Details',
        titleTamil: 'நோய் தாக்குதல் விவரங்கள்',
        url: 'https://www.tnagrisnet.tn.gov.in/home/disDetails/',
        icon: '🦠',
        category: 'resources',
        order: 17,
    },
    {
        title: 'Insurance Status (PMFBY)',
        titleTamil: 'பயிர்காப்பீடு நிலை',
        url: 'http://115.243.209.84/people_app/Pmfby/moreSearch/en?',
        icon: '📄',
        category: 'schemes',
        order: 18,
    },
    {
        title: 'Minimum Support Price',
        titleTamil: 'குறைந்தபட்ச ஆதார விலை',
        url: 'https://www.tnagrisnet.tn.gov.in/home/msp/en',
        icon: '💵',
        category: 'resources',
        order: 19,
    },
    {
        title: 'Digital Calendar for Agriculture',
        titleTamil: 'விவசாயத்திற்கான மின்னணு நாட்காட்டி',
        url: 'http://tnagriculture.in/calendar/',
        icon: '📅',
        category: 'resources',
        order: 20,
    },
    {
        title: 'Government Schemes',
        titleTamil: 'திட்டங்கள்',
        url: 'https://www.tnagrisnet.tn.gov.in/home/schemes/',
        icon: '🏛️',
        category: 'schemes',
        order: 21,
    },
    {
        title: 'Direct Procurement Centres',
        titleTamil: 'நேரடி கொள்முதல் நிலையங்கள்',
        url: 'https://tncsc.tn.gov.in/DPC.html',
        icon: '🏪',
        category: 'farmers',
        order: 22,
    },
];

/**
 * Sync important links to database
 * This replaces web scraping since the TN Agrisnet site uses Angular with dynamic rendering
 */
const syncImportantLinks = async () => {
    console.log('[GovernmentNews] Starting sync of important links...');

    try {
        let updated = 0;
        let created = 0;

        for (const link of IMPORTANT_LINKS) {
            const existingLink = await GovernmentNews.findOne({ url: link.url });

            if (existingLink) {
                // Update existing
                existingLink.title = link.title;
                existingLink.titleTamil = link.titleTamil;
                existingLink.icon = link.icon;
                existingLink.category = link.category;
                existingLink.order = link.order;
                existingLink.lastScrapedAt = new Date();
                existingLink.isActive = true;
                await existingLink.save();
                updated++;
            } else {
                // Create new
                await GovernmentNews.create({
                    ...link,
                    lastScrapedAt: new Date(),
                    isActive: true,
                });
                created++;
            }
        }

        console.log(`[GovernmentNews] Sync completed: ${created} created, ${updated} updated`);
        return { success: true, created, updated };
    } catch (error) {
        console.error('[GovernmentNews] Sync error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Try to scrape any additional dynamic links from the website
 * Falls back gracefully if scraping fails (Angular sites are hard to scrape)
 */
const scrapeAdditionalLinks = async () => {
    try {
        const response = await axios.get('https://www.tnagrisnet.tn.gov.in/home/important_links/', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

        // Try to find any additional links in the important links section
        const additionalLinks = [];

        // Look for links in common patterns
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            const text = $(element).text().trim();

            // Filter for relevant government links
            if (href && text &&
                (href.includes('tnagrisnet') || href.includes('tnagriculture') || href.includes('tn.gov.in')) &&
                !href.includes('{{') && // Exclude Angular template variables
                text.length > 3 &&
                text.length < 100) {
                additionalLinks.push({ url: href, text });
            }
        });

        console.log(`[GovernmentNews] Found ${additionalLinks.length} additional links from scraping`);
        return additionalLinks;
    } catch (error) {
        console.log('[GovernmentNews] Scraping skipped (Angular site):', error.message);
        return [];
    }
};

/**
 * Get all active government news items
 */
const getActiveNews = async () => {
    return await GovernmentNews.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .lean();
};

/**
 * Get news by category
 */
const getNewsByCategory = async (category) => {
    return await GovernmentNews.find({ isActive: true, category })
        .sort({ order: 1 })
        .lean();
};

module.exports = {
    syncImportantLinks,
    scrapeAdditionalLinks,
    getActiveNews,
    getNewsByCategory,
    IMPORTANT_LINKS,
};

const app = require('./app');
const connectDB = require('./config/db');
const { schedulePriceUpdates } = require('./controllers/marketController');
const { syncImportantLinks } = require('./services/governmentNewsService');
const { syncDistricts } = require('./services/seedAvailabilityService');
const cron = require('node-cron');
const env = require('./config/env');
const fs = require('fs');
const path = require('path');

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/diseases', 'uploads/profiles', 'uploads/equipment', 'uploads/livestock', 'uploads/general'];
uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Connect to database
connectDB();

// Build Scheduler
schedulePriceUpdates();

// Initial sync of government news and seed districts
setTimeout(async () => {
    console.log('[Startup] Syncing government news...');
    await syncImportantLinks();
    console.log('[Startup] Syncing seed districts...');
    await syncDistricts();
}, 5000); // Delay 5 seconds after startup

// Schedule government news sync every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log('[Cron] Running government news sync...');
    await syncImportantLinks();
});

// Schedule seed availability sync every 12 hours
cron.schedule('0 */12 * * *', async () => {
    console.log('[Cron] Running seed districts sync...');
    await syncDistricts();
});

const PORT = env.port;

const server = app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🌱 Smart Agriculture API Server                     ║
  ║                                                       ║
  ║   🚀 Server running on port ${PORT}                      ║
  ║   📦 Environment: ${env.nodeEnv.padEnd(26)}  ║
  ║                                                       ║
  ║   API Endpoints:                                      ║
  ║   • Auth:       /api/auth                             ║
  ║   • Crops:      /api/crops                            ║
  ║   • Diseases:   /api/diseases                         ║
  ║   • Market:     /api/market                           ║
  ║   • Irrigation: /api/irrigation                       ║
  ║   • Equipment:  /api/equipment                        ║
  ║   • Labor:      /api/labor                            ║
  ║   • Livestock:  /api/livestock                        ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

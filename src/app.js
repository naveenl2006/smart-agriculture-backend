const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const cropRoutes = require('./routes/cropRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const marketRoutes = require('./routes/marketRoutes');
const irrigationRoutes = require('./routes/irrigationRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const laborRoutes = require('./routes/laborRoutes');
const livestockRoutes = require('./routes/livestockRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const cropScheduleRoutes = require('./routes/cropScheduleRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const governmentNewsRoutes = require('./routes/governmentNewsRoutes');
const seedRoutes = require('./routes/seedRoutes');
const farmSetupRoutes = require('./routes/farmSetupRoutes');
const supportRoutes = require('./routes/supportRoutes');
const iotRoutes = require('./routes/iotRoutes');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration (handles OPTIONS preflight automatically)
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://smart-agriculture-frontend-omega.vercel.app']
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/irrigation', irrigationRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/labor', laborRoutes);
app.use('/api/livestock', livestockRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/crop-schedules', cropScheduleRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/government-news', governmentNewsRoutes);
app.use('/api/seeds', seedRoutes);
app.use('/api/farm-setup', farmSetupRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/iot', iotRoutes);

// Root route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Smart Agriculture Backend is running 🚜🌱"
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Agriculture API is running',
        timestamp: new Date().toISOString(),
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

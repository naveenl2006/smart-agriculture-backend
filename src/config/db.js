const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.mongodbUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB error: ${err}`);
});

module.exports = connectDB;

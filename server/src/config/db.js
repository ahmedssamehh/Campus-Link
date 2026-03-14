// src/config/db.js
const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async() => {
    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                heartbeatFrequencyMS: 10000,
                maxPoolSize: 10,
                minPoolSize: 2,
                maxIdleTimeMS: 30000,
                retryWrites: true,
                retryReads: true,
            });

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log("✅ CONNECTED DB:", mongoose.connection.name);

            mongoose.connection.on('error', (err) => {
                console.error('⚠️  MongoDB connection error:', err.message);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected. Mongoose will auto-reconnect...');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
            });

            return;
        } catch (error) {
            console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
            if (attempt < MAX_RETRIES) {
                console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            } else {
                console.error('❌ All MongoDB connection attempts failed. Exiting.');
                process.exit(1);
            }
        }
    }
};

module.exports = connectDB;
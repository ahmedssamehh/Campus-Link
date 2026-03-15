const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async () => {
    logger.info('Connecting to MongoDB...');

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

            logger.info('MongoDB connected: %s', conn.connection.host);

            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error: %s', err.message);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected. Mongoose will auto-reconnect...');
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
            });

            return;
        } catch (error) {
            logger.error('MongoDB connection attempt %d/%d failed: %s', attempt, MAX_RETRIES, error.message);
            if (attempt < MAX_RETRIES) {
                logger.info('Retrying in %ds...', RETRY_DELAY_MS / 1000);
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            } else {
                logger.error('All MongoDB connection attempts failed. Exiting.');
                process.exit(1);
            }
        }
    }
};

module.exports = connectDB;

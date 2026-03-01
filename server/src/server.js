// src/server.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('❌ Unhandled Rejection:', err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

// Connect to MongoDB and start server
connectDB().then(() => {
    // Verify models are loaded
    console.log('🔍 Verifying models after connection...');
    console.log('Available models:', Object.keys(mongoose.models));
    console.log('🔍 Database name from mongoose:', mongoose.connection.db.databaseName);

    const server = app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV}`);
        console.log(`🌐 API URL: http://localhost:${PORT}`);
        console.log('✅ All systems ready!');
    });
});
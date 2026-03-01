// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async() => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log("✅ CONNECTED DB:", mongoose.connection.name);

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
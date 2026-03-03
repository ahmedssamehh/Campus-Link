// src/models/Activity.js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: { type: String, enum: ['user', 'group'], required: true },
    name: { type: String, required: true },
    action: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

// Automatically delete activity records 15 days after creation
// MongoDB TTL index: 15 days = 1,296,000 seconds
activitySchema.index({ date: 1 }, { expireAfterSeconds: 1296000 });

module.exports = mongoose.model('Activity', activitySchema);
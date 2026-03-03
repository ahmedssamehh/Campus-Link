// src/models/JoinRequest.js
const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Prevent duplicate requests
joinRequestSchema.index({ user: 1, group: 1 }, { unique: true });

// Auto-delete approved/rejected requests after 15 days (1,296,000 seconds)
// TTL index on updatedAt - records will be deleted 15 days after status change
joinRequestSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 1296000 });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
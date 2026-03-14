// src/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    visibleTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    expiresAt: {
        type: Date,
        required: true,
        default: function() {
            // Default: expire 30 days after creation for unread announcements
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
announcementSchema.index({ group: 1, createdAt: -1 });
announcementSchema.index({ group: 1, visibleTo: 1, createdAt: -1 });
announcementSchema.index({ createdBy: 1 });

// TTL index: auto-delete when expiresAt date is reached
// Unread announcements: 30 days from creation
// Read announcements: 15 days from first read (updated in controller)
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Announcement', announcementSchema);
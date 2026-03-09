// src/models/ChatMembership.js
const mongoose = require('mongoose');

const chatMembershipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatType: {
        type: String,
        enum: ['group', 'private'],
        required: true
    },
    chatId: {
        type: String,
        required: true
    },
    lastSeenAt: {
        type: Date,
        default: null
    },
    lastSeenMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }
}, {
    timestamps: true
});

// Compound index for fast lookups
chatMembershipSchema.index({ user: 1, chatType: 1, chatId: 1 }, { unique: true });
chatMembershipSchema.index({ user: 1, chatType: 1 });

module.exports = mongoose.model('ChatMembership', chatMembershipSchema);
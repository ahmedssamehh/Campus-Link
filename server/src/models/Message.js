// src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: 5000
    },
    type: {
        type: String,
        enum: ['text', 'file', 'system'],
        default: 'text'
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

// Validation: exactly one of group or receiver must be set
messageSchema.pre('validate', function(next) {
    if (this.group && this.receiver) {
        return next(new Error('A message cannot have both group and receiver'));
    }
    if (!this.group && !this.receiver) {
        return next(new Error('A message must have either a group or a receiver'));
    }
    next();
});

module.exports = mongoose.model('Message', messageSchema);
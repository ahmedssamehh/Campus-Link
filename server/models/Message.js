// Message Model
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Define message schema here
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
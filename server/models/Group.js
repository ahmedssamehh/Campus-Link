// Group Model
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    // Define group schema here
}, {
    timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
// Notification Model
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Define notification schema here
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
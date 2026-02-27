// User Model
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Define user schema here
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
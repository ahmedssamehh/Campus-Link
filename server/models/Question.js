// Question Model
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    // Define question schema here
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);
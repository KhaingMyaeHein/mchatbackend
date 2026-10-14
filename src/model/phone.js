const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
    phonenumber: {
        type: String,
        required: true,    // Fixed: 'require' -> 'required'
        unique: true,
        index: true        // Added index as requested (note: unique: true already creates an index automatically)
    },
    country: {
        type: String,
        required: true     // Fixed: 'require' -> 'required'
    },
    isActive: {            // Renamed from 'Activate' to follow standard boolean naming conventions
        type: Boolean,
        default: false     // Fixed: 'defaule: fulse' -> 'default: false'
    },
    isActivate: {
        type: Boolean,
        default: false
    },
    createdAt: {           // Fixed typo: 'cretaedAt' -> 'createdAt'
        type: Date,
        default: Date.now  // Fixed: removed '()'. It must be a function reference, otherwise it evaluates once when the app starts, not when each document is created.
    }
});
module.exports = mongoose.model('Phone', phoneSchema);
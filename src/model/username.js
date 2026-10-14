const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    phoneID: {
      type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Phone'
    },
    username: {
        type: String,
    },
    birthday: {
        type: Date
    },
    email: {
        type: String
    },
    avatar: {
        type: String
    },
   lastSeen:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User',userSchema);
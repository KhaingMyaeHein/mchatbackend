const crypto = require("crypto");

// 1. Generates both the code and the expiry time together
const generateOTPData = () => {
    // randomInt(1000, 9999) guarantees a 4-digit number. padStart ensures "0567" doesn't become "567"
    const code = crypto.randomInt(1000, 9999).toString().padStart(4, '0');
    const expiry = Date.now() + 1 * 60 * 1000; // Valid for 1 minute
    
    return {
        code: code,
        expiry: expiry
    };
};

// 2. Verifies the input against the STORED OTP data
const verifyOTP = (inputOTP, storedOTPData) => {
    // If no OTP data exists for this user
    if (!storedOTPData) {
        return { success: false, message: "No OTP found. Please request a new one." };
    }

    // Check if current time is past the stored expiry time
    if (Date.now() > storedOTPData.expiry) {
        return { success: false, message: "OTP expired" };
    }

    // Check if the codes match
    if (inputOTP !== storedOTPData.code) {
        return { success: false, message: "Invalid OTP" };
    }

    return { success: true, message: "OTP verified successfully" };
};

module.exports = { generateOTPData, verifyOTP };
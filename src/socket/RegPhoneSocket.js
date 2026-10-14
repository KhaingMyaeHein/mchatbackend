const Phone = require('../model/phone'); // Make sure this path is correct (model vs models)
const { generateOTPData, verifyOTP } = require("../otp/genOTP");
const jwt = require('jsonwebtoken');
const phoneMap = new Map();
const otpMap = new Map();
const stratScreen = (socket) => {
    socket.on("startClick", async (data, ack) => {
        try{
            const { phoneNumber, country} = data;
            if(!phoneNumber){
                return socket.emit("error", { message: "Phone number is required" });
            }
            const exitPhone = await Phone.findOne( {phonenumber :phoneNumber});
            if(exitPhone){
                return socket.emit("error", { message: "Already registered."})
            }
              phoneMap.set(phoneNumber, {
                socketId: socket.id,
                country: country,                
            });
            if(typeof ack === 'function'){
                ack({messsage:{success: true}})
            }
            // console.log("Full Map Data:", Object.fromEntries(phoneMap));
        }catch(error){
            console.error("Error in StartScreen:", error);
            socket.emit("error", { message: "An error occurred during ClickStart" });
        }
    })
}
const preDisconnected = (socket) => {
    socket.on("predisconnect", async (data) => {
        try{
            const { phoneNumber } = data;
            if(phoneNumber){
                console.log("Full Map Data 1:", Object.fromEntries(phoneMap));
                if(phoneMap.has(phoneNumber)){
                    phoneMap.delete(phoneNumber);
                    console.log("Full Map Data 2:", Object.fromEntries(phoneMap));
                }
            }
        }catch(error){
            console.error("Error in StrartScreen:", error);
            socket.emit("error", {
                message: "An error occurred during Disconnect"
            })
        }
    })
}
const phoneRegister = (socket) => {
    // 1. ADD 'ack' TO THE PARAMETERS
    socket.on("sendOTP", async (data, ack) => {
        try {
            const { phoneNumber } = data;

            if (!phoneNumber) {
                const errorResponse = { success: false, message: "Phone number is required" };
                if (typeof ack === 'function') return ack(errorResponse);
                return socket.emit("error", errorResponse);
            }

            let otpData = generateOTPData();
             if (typeof ack === 'function') {
                ack({ 
                    success: true,
                    otpCode: otpData.code,
                    exp: otpData.expiry
                });
            } 
            otpMap.set(phoneNumber, {
                code: otpData.code,
                expiry : otpData.expiry,                
            });
            console.log("Full Map Data 2:", Object.fromEntries(otpMap));
        } catch (error) {
            console.error("Error in phoneRegister:", error);
            const errorResponse = { success: false, message: "An error occurred during registration" };
            
            if (typeof ack === 'function') {
                return ack(errorResponse);
            }
            socket.emit("error", errorResponse);
        }
    });
};

// Assuming otpMap is defined globally or in this file:
// const otpMap = new Map();

const setupVerificationHandler = (socket) => {
  socket.on('verifyOTP', async (data, callback) => {
    // 1. Safety First: Ensure callback is always a function to prevent server crashes
    const safeCallback = typeof callback === 'function' ? callback : () => {};

    try {
      const { phoneNumber, country, otp } = data;

      // 2. Input Validation
      if (!phoneNumber || !otp) {
        return safeCallback({ success: false, message: "Phone number and OTP are required." });
      }

      // 3. Get stored data
      const storedData = otpMap.get(phoneNumber);
      
      if (!storedData) {
        return safeCallback({ success: false, message: "OTP not found, expired, or already used." });
      }

      // 4. Verify OTP
      const verifyResult = verifyOTP(otp, storedData);

      // 5. CLEANUP: Remove from map on success OR expiration to prevent reuse/memory leaks
      if (verifyResult.success || verifyResult.message?.includes("expired")) {
        otpMap.delete(phoneNumber);
      }

      // 6. HALT if verification failed (CRITICAL FIX: Original code proceeded even on failure)
      if (!verifyResult.success) {
        return safeCallback({ 
          success: false, 
          message: verifyResult.message || "Invalid OTP." 
        });
      }

      // ==========================================
      // SUCCESS PATH: Only execute if OTP is valid
      // ==========================================

      // 7. Advanced DB Operation: Use findOneAndUpdate with upsert to prevent duplicate phone entries
      const updatedPhone = await Phone.findOneAndUpdate(
        { phonenumber: phoneNumber },
        { country: country, isActivate: true },
        { new: true, upsert: true, runValidators: true }
      );

      // 8. Advanced JWT: Promisify jwt.sign to avoid callback hell and allow try/catch
      const token = await new Promise((resolve, reject) => {
        const payload = { user: { id: updatedPhone._id.toString() } };
        // Note: '7d' is safer and more readable than 360000 seconds (which is 100 hours)
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, generatedToken) => {
          if (err) reject(err);
          else resolve(generatedToken);
        });
      });

      // 9. Update phoneMap efficiently (O(1) time complexity)
      phoneMap.set(phoneNumber, { 
        userId: updatedPhone._id.toString(), 
        socketId: socket.id 
      });

      console.log(`✅ Verification successful for: ${phoneNumber}`);

      // 10. Send success response
      safeCallback({ 
        success: true,
        message: "Verification successful",
        token: token
      });
      console.log('token:',token);
    } catch (error) {
      // 11. Global Error Handling: Prevents the Node.js process from crashing
      console.error(`❌ Verification error for socket ${socket.id}:`, error);
      safeCallback({ 
        success: false, 
        message: "An internal server error occurred. Please try again." 
      });
    }
  });
};


module.exports = { phoneRegister, stratScreen , preDisconnected, setupVerificationHandler};
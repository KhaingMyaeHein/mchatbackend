const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    // ️ CHANGE THESE to match your .env file exactly!
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Add this temporarily to verify your server is reading the keys correctly
console.log("ImageKit Public Key:", process.env.IMAGEKIT_PUBLIC_KEY ? "✅ Loaded" : " UNDEFINED");
console.log("ImageKit Private Key:", process.env.IMAGEKIT_PRIVATE_KEY ? "✅ Loaded" : "❌ UNDEFINED");
console.log("ImageKit URL Endpoint:", process.env.IMAGEKIT_URL_ENDPOINT ? "✅ Loaded" : "❌ UNDEFINED");

module.exports = imagekit;
const { Msg } = require('../utils/core');
const path = require('path');
const fs = require('fs');
const { uniquename } = require('../utils/core');
const imageKit = require('../config/imagekit');

const uploadSingle = async (req, res, next) => {
    try {
        console.log("➡️ 1. Entered uploadSingle middleware");
        
        if (!req.file || !req.file.buffer) {
            console.error("❌ ERROR: No file buffer found! Check if multer is using memoryStorage().");
            return next(new Error("No file uploaded or invalid storage configuration!"));
        }

        console.log("Original Name:", req.file.originalname);
        console.log("Mime Type:", req.file.mimetype);
        console.log("File Size:", req.file.size, "bytes");

        const base64 = req.file.buffer.toString("base64");
        const uniqueFileName = uniquename(req.file.originalname);
        console.log("➡️ 2. Attempting ImageKit upload for:", uniqueFileName);

        const uploadPromise = imageKit.upload({
            file: base64,
            fileName: uniqueFileName,
            folder: "mchat/profiles"
        });

        let timeoutId;
        let result;
        try {
            result = await Promise.race([
                uploadPromise,
                new Promise((_, reject) => {
                    timeoutId = setTimeout(
                        () => reject(new Error("ImageKit upload timed out after 15 seconds.")),
                        15000
                    );
                })
            ]);
        } finally {
            clearTimeout(timeoutId);
        }

        if (!result || typeof result.url !== "string" || !result.url) {
            throw new Error("ImageKit upload did not return a file URL.");
        }

        console.log("✅ 3. ImageKit upload successful! URL:", result.url);

        // Attach to request for the next controller
        req.fileUrl = result.url;
        req.fileId = result.fileId;
        req.thumbnail = result.thumbnailUrl;

        return next();

    } catch (err) {
        console.error("❌ FATAL ERROR in uploadSingle:", err.message);
        return next(err);
    }
};

const uploadmultiple = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next(new Error("No files uploaded!"));
        }

        const uploadedFiles = await Promise.all(
            req.files.map(async (file) => {
                const base64 = file.buffer.toString("base64");
                const result = await imageKit.upload({
                    file: base64,
                    fileName: uniquename(file.originalname),
                    folder: "mchat/profiles" // Fixed folder name to match uploadSingle
                });

                return {
                    url: result.url,
                    fileId: result.fileId,
                    thumbnail: result.thumbnailUrl
                };
            })
        );

        req.fileUrls = uploadedFiles.map(file => file.url);
        req.fileIds = uploadedFiles.map(file => file.fileId);
        req.thumbnails = uploadedFiles.map(file => file.thumbnail);
        req.uploadedFiles = uploadedFiles;

        return next();
    } catch (err) {
        console.error("❌ FATAL ERROR in uploadmultiple:", err.message);
        return next(err);
    }
};

const deletesingleimage = (req, res, next) => {
    try {
        const { filename } = req.body;
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        fs.unlink(filePath, (err) => {
            if (err) {
                next(new Error('File not found!'));
            } else {
                Msg(res, 'File deleted successfully!');
            }
        });
    } catch (err) {
        next(err);
    }
};

const deleteMultipleImages = (req, res, next) => {
    try {
        const imageurls = req.body.imageurls; // Expecting an array of URLs or filenames
        
        if (!imageurls || !Array.isArray(imageurls)) {
            return next(new Error("Invalid imageurls array"));
        }

        // FIXED: Wrapped in new Promise so resolve/reject are defined
        const deletePromises = imageurls.map((url) => {
            return new Promise((resolve, reject) => {
                const filename = url.split('/uploads/')[1] || url; // Fallback to url if split fails
                const filePath = path.join(__dirname, '..', 'uploads', filename);
                
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.warn(`Warning: Could not delete ${filename}:`, err.message);
                        resolve(); // Resolve anyway so Promise.all doesn't fail on one missing file
                    } else {
                        resolve();
                    }
                });
            });
        });
    
        Promise.all(deletePromises)
            .then(() => {
                Msg(res, 'Files deleted successfully!');
            })
            .catch((err) => {
                next(err);
            });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    uploadSingle,
    uploadmultiple,
    deletesingleimage,
    deleteMultipleImages
};
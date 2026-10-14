const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    console.log('[Upload] Image part received:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
    });

    if (file && file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const uploadSingleImage = (req, res, next) => {
    const expectedBytes = Number(req.headers['content-length']) || null;
    let receivedBytes = 0;
    const onData = (chunk) => {
        receivedBytes += chunk.length;
    };
    const progressTimer = setInterval(() => {
        console.log('[Upload] Multipart body progress:', {
            receivedBytes,
            expectedBytes
        });
    }, 5000);

    req.on('data', onData);
    console.log('[Upload] Parsing multipart request:', {
        contentLengthBytes: expectedBytes || 'unknown'
    });

    upload.single('image')(req, res, (err) => {
        clearInterval(progressTimer);
        req.removeListener('data', onData);

        if (err) {
            if (req.aborted || res.destroyed) {
                console.warn('[Upload] Client disconnected before the multipart upload completed:', {
                    receivedBytes,
                    contentLengthBytes: req.headers['content-length'] || 'unknown'
                });
                return;
            }

            const statusCode = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
                ? 413
                : 400;

            console.error('[Upload] Multer error:', err.message);
            return res.status(statusCode).json({
                success: false,
                message: err.message || "Failed to process image upload."
            });
        }

        if (!req.file) {
            console.error("❌ Multer error: No file provided in 'image' field.");
            return res.status(400).json({
                success: false,
                message: "No image file provided in 'image' field."
            });
        }

        console.log('[Upload] Image received successfully:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            fileSizeBytes: req.file.size,
            requestSizeBytes: receivedBytes
        });

        next();
    });
};

module.exports = { uploadSingleImage };
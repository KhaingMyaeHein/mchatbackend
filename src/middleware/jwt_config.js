const jwt = require('jsonwebtoken');
const User = require('../model/phone'); // Import your User model

const user_jwt = async (req, res, next) => {
    try {
        // 1. Extract token properly (Standard "Bearer <token>" format)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token or invalid format provided.' 
            });
        }

        // Extract the actual token string (removes the "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token is missing.' 
            });
        }

        // 2. Verify token with explicit algorithm (Prevents Algorithm Confusion Attacks)
        // Note: jwt.verify is synchronous, so we do NOT need 'await'
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'] // Explicitly restrict allowed algorithms
        });

        // 3. Advanced Security: Verify the user still exists and is active
        // This prevents deleted or banned users from using old, valid tokens.
        const user = await User.findById(decoded.user.id).select('-password'); 
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User no longer exists.' 
            });
        }

        // Check if user is banned/suspended (Assuming you have an 'isActive' field)
        if (user.isActivate === false) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is suspended or inactive.' 
            });
        }

        // 5. Attach the fresh user object to the request and proceed
        req.user = user; 
        next();

    } catch (error) {
        // 6. Secure Error Handling (Never leak internal errors to the client)
        // In production, use a logger like Winston or Pino instead of console.error
        console.error('JWT Auth Error:', error.message); 

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Session expired. Please log in again.',
                code: 'TOKEN_EXPIRED' // Frontend can use this code to trigger a redirect
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token signature or format.',
                code: 'INVALID_TOKEN'
            });
        }

        // Fallback for unexpected errors
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error during authentication.' 
        });
    }
};

module.exports = {
                    user_jwt};
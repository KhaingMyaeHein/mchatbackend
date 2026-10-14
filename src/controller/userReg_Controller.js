const { Msg } = require('../utils/core');
const Username = require('../model/username');

const registerUser = async (req, res, next) => {
    try {
        const phoneID = req.user?.id;
        const avatar = req.fileUrl; // Fixed typo
        const { username, birthday, email } = req.body;

        if (!username || !birthday || !email) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const newUser = new Username({
            phoneID,
            username: username.trim(),
            birthday, // Mongoose will automatically parse "yyyy-MM-DD" to a Date object
            email: email.trim().toLowerCase(),
            avatar
        });

        await newUser.save();
        console.log(`✅ User profile created for phoneID: ${phoneID}`);

        Msg(res, 'User added successfully', { 
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "User already exists." });
        }
        console.error("❌ Error in registerUser:", error.message);
        next(error);
    }
};

module.exports = { registerUser };
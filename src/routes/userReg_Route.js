const express = require('express');
const router = express.Router();

const registerUser = require("../controller/userReg_Controller");
const uploadimagecontroller = require('../controller/Controller_upload');
const authmiddleware = require('../middleware/jwt_config');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.post(
    "/add",
    authmiddleware.user_jwt,
    uploadMiddleware.uploadSingleImage,
    uploadimagecontroller.uploadSingle,
    registerUser.registerUser
);

module.exports = router;
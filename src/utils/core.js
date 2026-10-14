const bcrypt = require("bcryptjs");
const path = require('path'); // <--- THIS MUST BE HERE
const Msg = ( res, msg = "", result ={}) => {
    return res.status(200).json({
        message: msg,
        result: result
    });
};

const salt = bcrypt.genSaltSync(10);

const Encoder = {
    encode: (password) => {
        return bcrypt.hashSync(password, salt);
    },
    compare: (password, hash) => {
        return bcrypt.compareSync(password, hash);
    }
}

const uniquename = (originalname) => {
    let name = path.basename(originalname, path.extname(originalname));
    // // clean name
    // name = name.toLowerCase().
    //     replace(/[^a-z0-9\-]/g, '').
    //     replace(/\-+/g, '-').
    //     replace(/^\-+|\-+$/g, '');
    return Date.now()+path.extname(originalname); 
}

module.exports = { Msg, Encoder, uniquename};
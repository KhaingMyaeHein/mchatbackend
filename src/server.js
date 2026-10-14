const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const colors = require("colors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { initializeSocket } = require ("./socket/socketConfig");
const app = express();
dotenv.config({ path: "./.env" }); 
const server = http.createServer(app);

connectDB();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
initializeSocket(server);

// http://localhost:5000/api/mchat/auth/add
app.use("/api/mchat/auth", require("./routes/userReg_Route"));


app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
    console.error(err);
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`.green.underline.bold);
});

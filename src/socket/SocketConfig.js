const { Server } = require("socket.io");
const { phoneRegister, stratScreen, preDisconnected,setupVerificationHandler} = require("./RegPhoneSocket");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"],
        },
        transports: ["websocket", "polling"]
    });
    const initPhoneNumber = io.of("/prefix");
    initPhoneNumber.on("connection", (socket) => {
        console.log(`New client connected to /prefix: ${socket.id}`);
        // socket.on("addPhoneNumber", (data) => {
        //     console.log(`Received phone number: ${data.phonenumber}`);
        //     console.log(`Received username: ${data.username}`);

        //     socket.emit("phoneNumberAdded", { message: "Phone number added successfully" });    
        // });
        phoneRegister(socket);
         stratScreen(socket);
         preDisconnected(socket);
         setupVerificationHandler(socket);
        socket.on("disconnect", () => {
            console.log(`Client disconnected from /prefix: ${socket.id}`);
        });
    });

    const chatNamespace = io.of("/chat");
    chatNamespace.on("connection", (socket, token) => {
        if (!token) {
            console.log(`Client connection rejected due to missing token: ${socket.id}`);
            socket.disconnect();
            return;
        }else {
            console.log(`Client connected with token: ${token}`);
        }
        console.log(`New client connected to /chat: ${socket.id}`);
        socket.on("sendMessage", (data) => {
            console.log(`Received message: ${data.message}`);
            chatNamespace.emit("newMessage", { message: data.message });
        });
        socket.on("disconnect", () => {
            console.log(`Client disconnected from /chat: ${socket.id}`);
        });
    });
    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });

});
    return io; 
}
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

module.exports = { initializeSocket, getIO };

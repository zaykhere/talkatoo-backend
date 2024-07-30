const express = require("express");
const { chats } = require("./data/data");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.json());
app.use(cors())
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
}));
dotenv.config();

connectDB();

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler)

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`.yellow.bold));

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000'
  }
})

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  });

  socket.on('join-chat', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  })

  socket.on('typing', (room) => socket.to(room).emit("typing"));
  socket.on('stop-typing', (room) => socket.to(room).emit('stop-typing'));

  socket.on('new-message', (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    if(!chat.users) return console.log("Users not found");

    chat.users.forEach((user) => {
      if(user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message-received", newMessageReceived);
    })
  });

})
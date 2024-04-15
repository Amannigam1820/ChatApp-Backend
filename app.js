import express from "express";
import { connectDB } from "./utils/feature.js";
import dotenv from "dotenv";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { v4 as uuid } from "uuid";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.model.js";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middleware/auth.middleware.js";

dotenv.config({
  path: "./.env",
});

connectDB(process.env.MONGO_URI);



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const port = process.env.PORT || 3000;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
export const adminSecretKey = process.env.ADMIN_SECRET_KEY || "qwerty";

const userSocketIDs = new Map();
const onlineUsers = new Set()

const app = express();
const server = createServer(app);

app.use(cookieParser());

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("Home Route");
});

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
  const user = socket.user;

  userSocketIDs.set(user._id.toString(), socket.id);
  // console.log(userSocketIDs);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForREalTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chatId,
      createdAt: new Date().toISOString(),
    };
    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };
    //console.log("Emitting", messageForREalTime);

    const memberSocket = getSockets(members);
    io.to(memberSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForREalTime,
    });
    io.to(memberSocket).emit(NEW_MESSAGE_ALERT, { chatId });

    try {
      await Message.create(messageForDB);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(START_TYPING,({member, chatId})=>{
      //console.log("typing", member, chatId);
      const membersSocket = getSockets(member);
      socket.to(membersSocket).emit(START_TYPING,{chatId})
  })

  socket.on(STOP_TYPING,({member, chatId})=>{
    //console.log("typing", member, chatId);
    const membersSocket = getSockets(member);
    socket.to(membersSocket).emit(STOP_TYPING,{chatId})
})

socket.on(CHAT_JOINED, ({ userId, member }) => {
  onlineUsers.add(userId);

  const membersSocket = getSockets(member);
  io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
});

socket.on(CHAT_LEAVED, ({ userId, member }) => {
  onlineUsers.delete(userId);

  const membersSocket = getSockets(member);
  io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
});

  socket.on("disconnect", () => {
    // console.log("user disconnect");
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers))
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`server in running on port ${port} in ${envMode} MODE `);
});

export { envMode, userSocketIDs };

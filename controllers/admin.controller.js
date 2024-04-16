import { TryCatch } from "../middleware/error.middleware.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../utils/feature.js";
import {adminSecretKey} from "../app.js"

// const adminLogin = TryCatch(async (req, res, next) => {
//   const { secretKey } = req.body;

  
//   const isMatched = secretKey === adminSecretKey;
//   if (!isMatched) {
//     return next(new ErrorHandler("Invalid Admin key", 401));
//   }
//   const token = jwt.sign(secretKey, process.env.JWT_SECRET_KEY);
//   return res
//     .status(200)
//     .cookie("tokens", token, {
//       ...cookieOptions,
//       maxAge: 1000 * 60 * 15,
//     })
//     .json({
//       success: true,
//       message: "authenticated successfully",
//     });
// });
const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  const isMatched = secretKey === adminSecretKey;
  if (!isMatched) {
    return next(new ErrorHandler("Invalid Admin key", 401));
  }

  // Generate JWT token
  const token = jwt.sign({ secretKey }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

  const option = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'none',
    secure: true
  };

  // Set token as a cookie in the response
  res.cookie("tokens", token, option);

  // Respond with success message
  return res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    token
  });
});


const adminLogout = TryCatch(async (req, res, next) => {
  const pastDate = new Date(0);
  return res
  
  .clearCookie("tokens", "", {
    ...cookieOptions,
    //expires: pastDate,
  })
  .json({
    success: true,
    message: "Admin logout successfully",
  });
});

const getAdminData = TryCatch(async(req,res,next)=>{
 
  return res.status(200).json({
    admin:true
  })
})

const allUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});

  const transformUsers = await Promise.all(
    users.map(async ({ name, username, avatar, _id }) => {
      const [groups, friends] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);
      return {
        name,
        username,
        avatar: avatar.url,
        _id,
        groups,
        friends,
      };
    })
  );

  return res.status(200).json({
    success: true,
    users: transformUsers,
  });
});

const allChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")
    .populate("creator", "name avatar");

  const transformChat = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });
      return {
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  return res.status(200).json({
    success: true,
    chats: transformChat,
  });
});

const allMessages = TryCatch(async (req, res, next) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

  const transform = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat._id,
      groupChat: chat.groupChat,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    })
  );

  return res.status(200).json({
    success: true,
    messages: transform,
  });
});

const getDashboardStats = TryCatch(async (req, res, next) => {
  const [groupsCount, usersCount, messagesCount, totalChatsCounts] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMiliSeconds = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliSeconds;
    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCounts,
    messagesChart: messages,
  };

  return res.status(200).json({
    success: true,
    stats,
  });
});

export {
  adminLogin,
  adminLogout,
  allUsers,
  allChats,
  allMessages,
  getDashboardStats,
  getAdminData
};

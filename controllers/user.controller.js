import { compare } from "bcrypt";
import { User } from "../models/user.model.js";
import { emitEvent, sentToken, uploadFilesToCloudinary } from "../utils/feature.js";
import { TryCatch } from "../middleware/error.middleware.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.model.js";
import { Request } from "../models/request.model.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import {getOtherMember} from "../lib/helper.js"

const SignUp =  TryCatch(async (req, res) => {
  const { name, username, password, bio } = req.body;
const file = req.file
if(!file){
  return next(
    new ErrorHandler("Please upload avatar", 404)
  )
}

const result = await uploadFilesToCloudinary([file])


  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };


  const user = await User.create({
    name,
    username,
    bio,
    password,
    avatar,
  });

  sentToken(user, 201, res, "User created");
})

const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    return next(new ErrorHandler("invalid username or password", 404));
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("invalid username or password", 404));
  }
  // sendToken(res, user, 201,`Welcome back, ${user.name}`)
  sentToken(user, 201, res, "User Logged In!");
});

const getMyProfile = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user);
  res.status(200).json({
    success: true,
    user,
  });
});

const logout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      sameSite: 'none',
    secure: true
    })
    .json({
      success: true,
      message: "Logout successfully",
    });
});

const searchUser = TryCatch(async (req, res, next) => {
  const { name = "" } = req.query;
  // finding all my chats

  const myChat = await Chat.find({
    groupChat: false,
    members: req.user,
  });

  // All user from mychat means friends or people i have chatted with
  const allUsersFromMyChat = myChat.flatMap((chat) => chat.members);

  // finding user which is not chatted with
  const allUserExpectMeAndFriend = await User.find({
    _id: { $nin: allUsersFromMyChat },
    name: { $regex: name, $options: "i" },
  });

  const users = allUserExpectMeAndFriend.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res.status(200).json({
    success: true,
    users,
  });
});

const sendFriendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;
  const request = await Request.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });

  if (request) {
    return next(new ErrorHandler("Request already sent", 400));
  }
  await Request.create({
    sender: req.user,
    receiver: userId,
  });
  emitEvent(req, NEW_REQUEST, [userId]);

  res.status(200).json({
    success: true,
    Message: "Frind request Sent",
  });
});

const acceptFriendRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;
  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

   

  if (!request) {
    return next(new ErrorHandler("Request not found", 404));
  }
  if (request.receiver._id.toString() !== req.user.toString()) {
    return next(
      new ErrorHandler("You are not Authorized to accept this request", 401)
    );
  }

  if (!accept) {
    await request.deleteOne();
    res.status(200).json({
      success: true,
      Message: "Frind request deleted",
    });
  }
  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  res.status(200).json({
    success: true,
    Message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
});

const getMyNotification = TryCatch(async (req, res, next) => {
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender",
    "name avatar"
  );

  const allRequests = requests.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,
    },
  }));
  return res.status(200).json({
    success: true,
    allRequests,
  });
});

const getMyFriends  =TryCatch(async(req,res,next)=>{
    const chatId = req.query.chatId;

    const chats = await Chat.find({groupChat:false, members:req.user}).populate("members","name avatar")

    const friends = chats.map(({members})=>{
        const otherUser = getOtherMember(members, req.user)
        return {
            _id:otherUser._id,
            name:otherUser.name,
            avatar:otherUser.avatar
        }
    })
    if(chatId){
            const chat = await Chat.findById(chatId);
            const availableFriends = friends.filter(
                (friend)=>!chat.members.includes(friend._id)
            )
            return res.status(201).json({
                success:true,
                availableFriends
            })
    }else{
        return res.status(201).json({
            success:true,
            friends
        })
    }
})

export {
  SignUp,
  login,
  getMyProfile,
  logout,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getMyNotification,
  getMyFriends
};

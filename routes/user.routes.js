import express from "express";
import {
  SignUp,
  acceptFriendRequest,
  getMyFriends,
  getMyNotification,
  getMyProfile,
  login,
  logout,
  searchUser,
  sendFriendRequest,
} from "../controllers/user.controller.js";
import { singleAvatar } from "../middleware/multer.middleware.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  acceptRequestValidator,
  loginValidator,
  registerValidator,
  sendRequestValidator,
  validateHandler,
} from "../lib/validators.js";

const app = express.Router();

app.post("/new", singleAvatar, registerValidator(), validateHandler, SignUp);
app.post("/login", loginValidator(), validateHandler, login);

// After here user must be logged in to access the route

app.get("/me", isAuthenticated, getMyProfile);
app.get("/logout", isAuthenticated, logout);
app.get("/search", isAuthenticated, searchUser);
app.put(
  "/sendrequest",
  isAuthenticated,
  sendRequestValidator(),
  validateHandler,
  sendFriendRequest
);
app.put(
  "/acceptrequest",
  isAuthenticated,
  acceptRequestValidator(),
  validateHandler,
  acceptFriendRequest
);

app.get("/notification", isAuthenticated, getMyNotification);

app.get("/friends", isAuthenticated, getMyFriends)

export default app;

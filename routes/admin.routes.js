import express from "express";
import {
    adminLogin,
  adminLogout,
  allChats,
  allMessages,
  allUsers,
  getAdminData,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
 import { adminOnly } from "../middleware/auth.middleware.js";

const app = express.Router();

app.post("/verify", adminLoginValidator(), validateHandler, adminLogin)
app.get("/logout",adminLogout)

// Only admin can access these route

 app.use(adminOnly)

app.get("/", getAdminData)
app.get("/users", allUsers);
app.get("/chats", allChats);
app.get("/messages", allMessages);
app.get("/stats", getDashboardStats);

export default app;

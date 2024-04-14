import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  addMembers,
  deleteChat,
  getChatDetails,
  getMessage,
  getMyChat,
  getMyGroup,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroup,
  sendAttachments,
} from "../controllers/chat.controller.js";
import { attachmentsMulter } from "../middleware/multer.middleware.js";
import {
  addMemberValidator,
  chatIdValidator,
  newGroupValidator,
  removeMemberValidator,
  renameValidator,
  sendAttachmentValidator,
  validateHandler,
} from "../lib/validators.js";

const app = express.Router();

app.use(isAuthenticated);

app.post("/new", newGroupValidator(), validateHandler, newGroupChat);

app.get("/my", getMyChat);

app.get("/my/groups", getMyGroup);

app.put("/addmembers", addMemberValidator(), validateHandler, addMembers);

app.put(
  "/removemember",
  removeMemberValidator(),
  validateHandler,
  removeMember
);

app.delete("/leave/:id", chatIdValidator(), validateHandler, leaveGroup);

app.post(
  "/message",
  attachmentsMulter,
  sendAttachmentValidator(),
  validateHandler,
  sendAttachments
);

app.get("/message/:id", chatIdValidator(), validateHandler, getMessage);

app
  .route("/:id")
  .get(chatIdValidator(), validateHandler, getChatDetails)
  .put(renameValidator(), validateHandler, renameGroup)
  .delete(chatIdValidator(), validateHandler, deleteChat);

export default app;

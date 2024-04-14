import { body, check, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessage = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  if (errors.isEmpty()) return next();
  else next(new ErrorHandler(errorMessage, 400));
};

const registerValidator = () => [
  body("name", "Please enter name").notEmpty(),
  body("username", "Please enter username").notEmpty(),
  body("bio", "Please enter bio").notEmpty(),
  body("password", "Please enter password").notEmpty(),
  // check("avatar", "Please upload avatar").notEmpty(),
];

const loginValidator = () => [
  body("username", "Please enter username").notEmpty(),
  body("password", "Please enter password").notEmpty(),
];

const newGroupValidator = () => [
  body("name", "Please enter name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please enter members")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be 2-100"),
];

const addMemberValidator = () => [
  body("chatId", "Please enter Chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please enter members")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];

const removeMemberValidator = () => [
  body("chatId", "Please enter Chat ID").notEmpty(),
  body("userId", "Please enter User ID").notEmpty(),
];

const sendAttachmentValidator = () => [
  body("chatId", "Please enter Chat ID").notEmpty(),
  // check("files")
  //   .notEmpty()
  //   .withMessage("Please upload Attachments")
  //   .isArray({ min: 1, max: 5 })
  //   .withMessage("Members must be 1-5"),
];

const chatIdValidator = () => [param("id", "Please enter Chat ID").notEmpty()];

const renameValidator = () => [
  param("id", "Please enter Chat ID").notEmpty(),
  body("name", "Please enter Name").notEmpty(),
];
const sendRequestValidator = () => [
  body("userId", "Please enter User ID").notEmpty(),
];

const acceptRequestValidator = () => [
  body("requestId", "Please enter Request ID").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept must be boolean"),
];
const adminLoginValidator = () =>[
  body("secretKey", "Please enter secretKey").notEmpty(),
]

export {
  addMemberValidator,
  chatIdValidator,
  loginValidator,
  newGroupValidator,
  registerValidator,
  removeMemberValidator,
  sendAttachmentValidator,
  validateHandler,
  renameValidator,
  sendRequestValidator,
  acceptRequestValidator,
  adminLoginValidator
};

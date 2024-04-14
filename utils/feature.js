import mongoose from "mongoose";
//import {User} from "../models/user.model.js"
// import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { getBase64 } from "../lib/helper.js";
import { getSockets } from "../lib/helper.js";

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "chat-app" })
    .then((data) => {
      console.log(`Connected to DB : ${data.connection.host}`);
    })
    .catch((err) => {
      throw err;
    });
};

const sentToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  //console.log(token);
  const option = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  res.status(statusCode).cookie("token", token, option).json({
    success: true,
    user,
    message,
    token,
  });
};

const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const emitEvent = (req, event, users, data) => {

  let io = req.app.get("io");
  const userSocket = getSockets(users);
  io.to(userSocket).emit(event,data)
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadPromises);
    const formatttedResult = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formatttedResult;
  } catch (error) {
    throw new Error("Error uploading files to cloudinary", error);
  }
};

const deleteFilesFromCloudinary = async (public_ids) => {};

export {
  connectDB,
  sentToken,
  emitEvent,
  deleteFilesFromCloudinary,
  cookieOptions,
  uploadFilesToCloudinary,
};

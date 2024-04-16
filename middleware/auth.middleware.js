import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.middleware.js";
import { adminSecretKey } from "../app.js";
import { User } from "../models/user.model.js";

const isAuthenticated = TryCatch(async (req, res, next) => {
  const { token } = req.cookies;

  console.log(token);
  

  if (!token) {
    return next(new ErrorHandler("Please login to access this route"), 401);
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
  req.user = decodedData._id;

  next();
});

const adminOnly = (req, res, next) => {
  const {tokens}  = req.cookies

   //console.log(tokens);
  

  if (!tokens) {
    return next(new ErrorHandler("Only admin to access this route", 401));
  }
  const option = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'none',
    secure: true
  };

  const secretKey = jwt.verify(tokens, process.env.JWT_SECRET_KEY,option);

  //console.log(secretKey.secretKey, adminSecretKey);

  const isMatched = secretKey.secretKey === adminSecretKey;

  //console.log(isMatched);
  if (!isMatched) {
    return next(new ErrorHandler("Invalid Admin key", 401));
  }
  next();

  // const token = req.cookies["token"];

  // console.log(token);

  // // if (!token)
  // //   return next(new ErrorHandler("Only Admin can access this route", 401));

  // // const secretKey = jwt.verify(token, process.env.JWT_SECRET);

  // // const isMatched = secretKey === adminSecretKey;

  // // if (!isMatched)
  // //   return next(new ErrorHandler("Only Admin can access this route", 401));

  //next();



  
};

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);
    const authToken = socket.request.cookies.token;
    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));
    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decodedData._id);
    if (!user) {
      return next(new ErrorHandler("Please login to access this route", 401));
    }
    socket.user = user;
    return next();
  } catch (error) {
   
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};

export { isAuthenticated, adminOnly, socketAuthenticator };

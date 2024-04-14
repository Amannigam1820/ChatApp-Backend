import mongoose, { Schema, model } from "mongoose";
import {hash} from 'bcrypt'
import jwt from "jsonwebtoken";


const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

schema.pre("save", async function(next){
  if(!this.isModified("password")) return next() 

  this.password = await hash(this.password, 10);

})

schema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

export const User = mongoose.models.User || model("User", schema);

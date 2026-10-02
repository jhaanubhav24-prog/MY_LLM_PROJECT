import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
import { email } from "zod";



const authUserMiddleware = async (req, res, next) => {
  try {
     const {token} = req.cookies;

    if (!token) 
    {
      return res.status(401).json({
        message: "You need to login First",
      });

    }

    const payload = jwt.verify(token,process.env.JWT_SECRET);

    // Ho sakta hai user ka token to valid ho par vo delete ho gaya hai
    const existingUser = await User.findById(payload.id);
    // const existingUser = await User.findOne({email:payload.email});
    // console.log("Existing User",existingUser)
    if(!existingUser)
    {
        return res.status(404).json({
                message: "User Doesnt Exist"
            })
    }    

    req.user = existingUser;
    next();


  } 
  catch (err) 
  
  {
    console.log("error in authMiddleWare", err);
    res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};

export default authUserMiddleware;
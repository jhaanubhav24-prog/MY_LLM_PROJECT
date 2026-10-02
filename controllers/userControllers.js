import jwt from "jsonwebtoken";
// import bcrypt from bcrypt;
import bcrypt from "bcrypt";

import User from "../models/userSchema.js";
import Chat from "../models/chatSchema.js";
import Message from "../models/msgSchema.js";

import {signupSchema,loginSchema} from "../validators/userValidators.js"




const createToken = (id,email)=>{
    
    if(!process.env.JWT_SECRET){
        throw new Error("JWT Secret key is Missing");
    }

    const token =  jwt.sign({id,email}, process.env.JWT_SECRET,{expiresIn:"300s"});
    return token;
}


const cookiesOption = {
    httpOnly: true,
    secure: false,
    maxAge: 5*60*1000
}

export const signup = async (req,res)=>{

    try
    {

        // validate all this data

        const result = signupSchema.safeParse(req.body);

        if(!result.success)
        {
            return res.status(400).json({
                message: result.error.issues[0].message
            })
        }

        const {name,age,email,password} = result.data;

        const user = await User.findOne({email});

        if(user)
        {
            return res.status(409).json(
                {message: "Email ID already exist"}
            )
        }

        const hashPassword = await bcrypt.hash(password,12);


        const userCreated = await User.create(
            {
                name,age,email,password:hashPassword
            }
        )

        const token = createToken(userCreated._id,email);

        res.cookie('token',token,cookiesOption);

        res.status(201).json({
        message:"User created SuccessFully",
        name,
        age,
        email
       });

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message: "Internal Server error"
        })

    }

}



export const login = async (req,res)=>{

    try{
    const {email,password} = req.body;
    // console.log("Working login")
    }
    catch(err)
    {
    //     if(!email || !password)
    // {
    //     return res.status(401).json({
    //         msg:"Useremail or password is not provided"
    //     })
    // }
         return res.status(401).json({
            msg:"Useremail or password is not provided"
        })
    }

    

    try 
    {
        // console.log("Before")
        const result = loginSchema.safeParse(req.body);
        // console.log("After")

        if(!result.success)
        {
            return res.status(400).json({
                message: result.error.issues[0].message
            })
        }

        const {email, password} = result.data;
        
        //verfiying existing User
        const existingUser = await User.findOne({email});
        // console.log(existingUser,existingUser.password);
        if(!existingUser)
            {
                return res.status(401).json({message:"Invalid Credentials"})
            }
            
            // match the password
            
            const isMatch = await bcrypt.compare(password,existingUser.password);
            // console.log("After")

        if(!isMatch)
        {
            return res.status(401).json({message:"Invalide Credentials"})
        }

        const token = createToken(existingUser._id,email);

        res.cookie("token",token,cookiesOption);

        res.status(200).json({
            message:"User Logged in SuccessFully",
            name: existingUser.name,
            age: existingUser.age,
            email: existingUser.email,
            usage: existingUser.usage
        });


    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            message: "Internal Server Error"
        });

    }


}

export const logout = async (req,res)=>{
    res.clearCookie("token",{
        httpOnly: true,
        secure: false,
    })

    res.status(200).json({
        message: "User Logged Out Successfully"
    })
}



export const profile = async (req,res)=>{

    try
    {
         // profile ki informat send karo
        // Database ke andar call kari padegi, us user ko search, _id, email

        res.status(200).json(
            {
                id:req.user._id,
                name:req.user.name,
                age:req.user.age,
                usage:req.user.usage,
                email:req.user.email
            }
        )
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            message: "Internal Server error"
        })
    }
}


export const deleteAccount = async (req,res) =>{
    
    try
    {
        const id = req.user._id;

        // pahle pure chat nikalte hai
        const chats = Chat.findAll({userId:id});
        

        // second pura message niaklate hai 
        const messages = Message.findAll({userId:id});

        // sabse pahle message delete karenge
        Message.deleteMany({userId:id});
        Chat.deleteMany({userId:id});
        User.deleteOne({_id:id});
        // User.deleteOne == db.deleteOne ==> yaha User database hai
        
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
        });
        res.status(200).json({
            message: "Account deleted successfully"
        });

    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            messages: "Internal Server Error"
        })
    }


}
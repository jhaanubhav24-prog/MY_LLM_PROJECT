import express from "express";
import 'dotenv/config';
import cookieParser from "cookie-parser";

import userRouter from "./routes/userRoute.js";
import chatRouter from "./routes/chatRoute.js";
import msgRouter from "./routes/msgRoute.js";

import connectDB from "./config/database.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/user",userRouter);
app.use("/chat",chatRouter);
app.use("/msg",msgRouter);


const startServer = async ()=>{
    try{

        await connectDB();

        app.listen(process.env.PORT,()=>{
            console.log(`Server has started listenting at port ${process.env.PORT}`);
        })

    }
    catch(err)
    {
        console.log(err);
    }
}

startServer();
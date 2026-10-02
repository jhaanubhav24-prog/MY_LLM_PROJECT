import express from 'express';

import {login,logout,signup,profile,deleteAccount} from "../controllers/userControllers.js"
import authUserMiddleware from '../middlewares/userAuthMiddle.js';


const userRouter = express.Router();


userRouter.post("/login",login);
userRouter.post('/logout',logout);
userRouter.post("/signup",signup);
userRouter.get('/profile',authUserMiddleware,profile);
userRouter.get('/deleteAccount',authUserMiddleware,deleteAccount);

export default userRouter;
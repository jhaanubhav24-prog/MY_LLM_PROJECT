import express from "express";
import authUserMiddleware from "../middlewares/userAuthMiddle.js";
import { getMessage, sendMessage } from "../controllers/messageControllers.js";


const msgRouter = express.Router();


msgRouter.use(authUserMiddleware);


msgRouter.get("/:chatId",getMessage);
msgRouter.post("/",sendMessage);
msgRouter.post("/:chatId",sendMessage);


export default msgRouter;
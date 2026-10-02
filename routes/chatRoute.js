import express from "express"
import authUserMiddleware from "../middlewares/userAuthMiddle.js";
import { createChat, deleteChat, getRecentChat, getSingleChat } from "../controllers/chatControllers.js";

const chatRouter = express.Router();


chatRouter.use(authUserMiddleware);


chatRouter.post('/createChat',createChat);
chatRouter.get("/getRecentChat",getRecentChat);
chatRouter.get('/:chatId',getSingleChat);
chatRouter.delete("/:chatId",deleteChat);

export default chatRouter;
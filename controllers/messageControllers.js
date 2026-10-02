import Message from "../models/msgSchema.js";
import Chat from "../models/chatSchema.js";
import mongoose from "mongoose";
import { hasTokenLimitReached, resetUsageIfNeeded,addUserTokenUsage } from "../utils/userUsage.js";
import {addChatTokenUsage} from "../utils/tokenUsage.js"
import { buildMessagForAI } from "../utils/chatContext.js";

import { generateAIResponse } from "../services/GeminiLLMServices.js";
import { updateSummaryIfNeeded } from "../services/summaryServices.js";


export const getMessage = async (req,res)=>{

    try{


        const {chatId} = req.params;

        // verfiy that this chatID belongs to this user or not
        
        const chat = await Chat.find({userId:req.user._id,_id:chatId});

        if(!chat)
        {
            return res.status(403).json({
                    message: "You are not allowed to do this"
                })
        }

        const message = await Message.find({chatId}).sort({createdAt:1}) ;

         res.status(200).json({
                messages: "Your are all messages are here",
                msg: messages
            });

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            messages: "Internal server error"
        })
    }

}


export const sendMessage = async (req,res)=>{

    try
    {
        const { chatId } = req.params;
        const { content, model } = req.body;

        // console.log(chatId,content,model)
         // 1. Validate message content
        if (!content || content.trim() === "") {
            return res.status(400).json({
             message: "Message content is required"
            });
        }

        // console.log(req.user);
        await resetUsageIfNeeded(req.user);


        if(hasTokenLimitReached(req.user))
        {
            return res.status(429).json({
                message:"Token limit reached. Please try after some time",
                usage:req.user.usage
            })
        }


        let chat; // kyuki ho sakta chat ho ya fir create karna pade

         // 2. Existing chat case
        if (chatId) 
        {
        // Check valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(chatId)) 
            {
             return res.status(400).json({
             message: "Invalid chat id"
             });
            }

            // jo chat id mila vo usse user ka hai ki nahi
            chat = await Chat.findOne({
                _id:chatId,
                userId:req.user._id
            });


            if (!chat) 
            {
                return res.status(404).json({
                  message: "Chat not found"
                });
            }
        }


        // 3. New chat case
        else 
        {
            if (!model) {
              return res.status(400).json({
                message: "Model is required for new chat"
              });
            }
        
            chat = await Chat.create({
              userId: req.user._id,
              model,
              topic: content.trim().slice(0, 40),
            });
        }     


        const oldMessages = await Message.find({
        chatId: chat._id,
        })
        .sort({ createdAt: 1 })
        .skip(chat.summarizedTillMessageNumber);

        // console.log(content);
        const messageForAI = buildMessagForAI(
           {
            chat,
            oldMessages,
            currentMessages:content.trim()
           }
        )

        // console.log(messageForAI);
        // console.log(model)
        const {aiReply,usage} = await generateAIResponse({
            model:chat.model,
            messages:messageForAI,
        })
    

        const userMessage = await Message.create({
            chatId: chat._id,
            role: "user",
            content: content.trim(),
            userId: req.user._id
        });

        const assistantMessage = await Message.create({
            chatId: chat._id,
            role: "assistant",
            content: aiReply,
            userId: req.user._id,
            usage:usage
        });

        chat.messageCount += 2; // yah chatCount badha raha hu

        if (chat.topic === "New Chat") 
        {
            chat.topic = content.trim().slice(0, 40);
        }


        await addChatTokenUsage(chat, usage);
        await addUserTokenUsage(req.user,usage.totalTokenCount);

        res.status(201).json({
            message: "Message sent successfully",
            chatId: chat._id,
            reply: aiReply,
            usage,
            userMessage,
            assistantMessage,
        });


        await updateSummaryIfNeeded(chat._id);

    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            msg:"Internal Server Error"
        })
    }

}
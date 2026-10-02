

import Chat from "../models/chatSchema.js";
import Message from "../models/msgSchema.js";

import { generateAIResponse } from "./GeminiLLMServices.js";

const SUMMARY_CHUNK_SIZE = 20;


export const updateSummaryIfNeeded = async(chatId)=>{

    const chat = await Chat.findById(chatId);
    console.log(chat);
    if(!chat) return;

    const unsummarizedCount = chat.messageCount - chat.summarizedTillMessageNumber;

    if(unsummarizedCount < SUMMARY_CHUNK_SIZE)
    {   
        console.log("working");
        return;
    }

    const messagesToSummarize = await Message.find({
        chatId:chat._id
    })
    .sort({createdAt:1})
    .skip(chat.summarizedTillMessageNumber)
    .limit(SUMMARY_CHUNK_SIZE)

    if(messagesToSummarize.length === 0) return;


    const summaryMessages = [
        {
            role:"user",
            parts:[{text:"Summarize the conversation. Keep important context, user goals, decisions, and unresolved doubts. Do not add extra information."}]
        },
        {
            role:"user",
            parts:[{text:`Previous summary: ${chat.summary || "No previous summary yet."}`}]
        },

        ...messagesToSummarize.map((msg)=>({
            role:msg.role,
            parts:[{text:msg.content}]
        })),

        {
            role:"user",
            parts:[{text:"Summarize the above conversation"}]
        }
    ];

    const {aiReply,usage} = await generateAIResponse({
        model:chat.model,
        messages:summaryMessages
    })

    chat.summary = aiReply;
    chat.summaryUpdatedAt = new Date();
    chat.summarizedTillMessageNumber += messagesToSummarize.length

    chat.usage.promptTokens += usage.promptToken;
    chat.usage.completionTokens += usage.candidatesToken;
    chat.usage.totalTokens += usage.totalTokenCount;

    
}



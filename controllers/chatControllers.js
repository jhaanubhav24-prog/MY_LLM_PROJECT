import Chat from "../models/chatSchema.js";
import Message from "../models/msgSchema.js";




export const getRecentChat = async(req,res)=>
{
        try
        {
            const chats = await Chat.find({userId:req.user._id}).select("topic updatedAt").sort({updatedAt:-1}).limit(20);

            
            res.status(200).json({
                message:"Your all recent chats",
                chats
            })


        }
        catch(err)
        {
            console.log(err);
            res.status(500).json({
                message: "Interna server error"
            })
        }
}


export const getSingleChat = async(req,res)=>{
    
    try
    {
        const {chatId} = req.params;


        if (!mongoose.Types.ObjectId.isValid(chatId)) 
        {
             return res.status(400).json({
             message: "Invalid chat id"
             });
        }

        // Checking chat id belong to that user or not
        const chat = await Chat.findOne({_id:chatId, userId:req.user._id});

        if(!chat)
        {
             return res.status(404).json({
                messages: "Sorry not data found"
            })
        }

        res.status(200).json(
            {
                chatId: chat._id,
                userId: chat.userId,
                topic: chat.topic,
                usage: chat.usage
            }
        )
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

export const createChat = async(req,res)=>{

    try
    {
        const {model} = req.body;
        if(!model)
        {
            return res.status(400).json({
                messages: "Model name is missing"
            })
        }


        const chats = await Chat.create({
            userId:req.userId,
            model
        })

         res.status(201).json({
            chatId: chats._id,
            userId: req.user._id,
            model,
            topic: chats.topic,
            createdAt: chats.createdAt
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message: "Interna server error"
        })
    }
}


export const deleteChat = async(req,res)=>{

    try
    {
        const {chatId} = req.params;

        const chat = await Chat.findOne({_id:chatId, userId: req.user._id});
        // also use in messageController send wale mein

        if(!chat)
        {
            return res.status(403).json({
                message: "You are not allowed to do this"
            })
        }

        //upar mein hi check kar liya user issi ka hai ki nahi isliye dobara check nahi kiya meine
        await Message.deleteMany({chatId});
        // {id:23423adsgasdg}
        await Chat.deleteOne({
            _id: chatId
        })


        res.status(200).json({
            message: "Your chat deleted successfully"
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message: "Internal server error"
        })
    }

}
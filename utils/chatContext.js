const SYSTEM_PROMPT = `
You are a helpful AI assistant.
Answer the user's question clearly and accurately.
If the user asks for code, provide clean and practical code.
If the user asks for explanation, explain in a simple and structured way.
If you are unsure, say that you are unsure instead of guessing.
Dont use abusive language, if user ask question related to something which
can harm other, dont answer it.
`;



export const buildMessagForAI = ({chat,oldMessages,currentMessages})=>{
    console.log("currentMsg ==> ",currentMessages);
    // console.log(oldMessages)
    const message = [{role:"user",parts:[{text:SYSTEM_PROMPT}]}];
    // const message = [];


    if(chat.summary && chat.summary.trim() !== "")
    {
        console.log("Inside chat summary")
        message.push({
            role:"user",
            parts:[{text:`Previous conversation summary:\n${chat.summary}`}]

        });
    }

    for(const msg of oldMessages)// [{},{},{}]
    {
        message.push({
            role:msg.role,
            parts:[{text:msg.content}]
        })
    }

    message.push({
        role:"user",
        parts:[{text:currentMessages}]
    })


    return message;

}


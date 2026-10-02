
import geminiLLM from "../config/GeminAILLM.js";


// const SYSTEM_PROMPT = `
// You are a helpful AI assistant.
// Answer the user's question clearly and accurately.
// If the user asks for code, provide clean and practical code.
// If the user asks for explanation, explain in a simple and structured way.
// If you are unsure, say that you are unsure instead of guessing.
// Dont use abusive language, if user ask question related to something which
// can harm other, dont answer it.
// `;

export const generateAIResponse = async({model,messages})=>{
    


    try
    {
        const response = await geminiLLM.models.generateContent({
        model:model,
        contents:messages
        });

        // console.log(response)
        const aiReply = response.candidates[0].content.parts[0].text;

        if(!aiReply)
        {
            throw new Error("AI response is empty")
        }
        
        // input Token == Prompt Token
    // output Token == completeio Token
        const promptToken = response.usageMetadata?.promptTokenCount || 0;
        const candidatesToken = response.usageMetadata?.candidatesTokenCount || 0;
        const completionTokens = response.usageMetadata?.totalTokenCount || 0;


        return(
            {
            aiReply,
            usage : {
                    promptToken,
                    candidatesToken,
                    totalTokenCount:completionTokens
            }
        }
        )
    }
    catch(err)
    {
       console.log(err);
       throw err;
    }
    


}
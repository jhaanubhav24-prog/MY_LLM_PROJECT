

export const addChatTokenUsage = async(chat,usage)=>{
        chat.usage.promptTokens += usage.promptToken;
        chat.usage.completionTokens += usage.candidatesToken;
        chat.usage.totalTokens += usage.totalTokenCount;

    await chat.save();
}
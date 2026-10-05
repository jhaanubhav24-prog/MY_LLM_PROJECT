export const resetUsageIfNeeded = async (user)=>{
    
    
    const now = new Date();
    
    if(now > user.usage.resetAt)
    {
        user.usage.tokenUsed = 0; // agar pichle wale ka token add karna hoga to 
        /*

        user.usage.tokenUsed = 0 karne se pahle

        token left = user.usage.tokenLimit - user.usage.tokenUsed;
        bach gaya 
        user.usage.tokenUsed = left agar 20 token bach gyaa to -20 to fir add userToekn 20 token extra ho jayega

        */

        user.usage.resetAt = new Date(Date.now()+5*60*60*1000) // yaha pe jab ho gaya purne wale reset se jayda time to jab vo message bhejega usse waqt se 5 hour more
        await user.save()
    }
}   

export const hasTokenLimitReached = (user)=>{
    return user.usage.tokenUsed >= user.usage.tokenLimit;
}

export const addUserTokenUsage = async (user,totalTokens)=>{

    user.usage.tokenUsed += totalTokens;
    user.usage.totalTokenUsed += totalTokens;

    await user.save();
}
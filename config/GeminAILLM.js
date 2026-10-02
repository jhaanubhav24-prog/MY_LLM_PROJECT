import { GoogleGenAI } from "@google/genai";


if(!process.env.GEMINI_API_KEY){
    throw new Error("GEMINI API Key is Missing");
}

const geminiLLM = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default geminiLLM;
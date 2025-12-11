import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: VITE_GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Testing Gemini API with gemini-flash-latest...");
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: {
                role: 'user',
                parts: [{ text: "Hello, are you working?" }]
            }
        });

        console.log("Response received:");
        console.log(Object.keys(response));
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error detected:");
        console.error(error);
    }
}

test();

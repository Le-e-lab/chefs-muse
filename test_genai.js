import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyBQSCY0CsAOB46rP8lMmdSc0VAdqCQKWUE";
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

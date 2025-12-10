import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: VITE_GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

async function list() {
    try {
        console.log("Listing models...");
        // The @google/genai SDK has a slightly different way to list models than the old one.
        // Assuming ai.models.list() exists based on the SDK structure pattern.
        const response = await ai.models.list();

        // The response might be an async iterable or a plain response object 
        // depending on the exact SDK version.
        // Let's print the raw response first or iterate.

        console.log("Raw response (pre-processing):", response);

        if (response && response.models) {
            response.models.forEach(m => console.log(m.name));
        } else {
            // If it returns an object with a different structure
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error("Error listing models:");
        console.error(error);
    }
}

list();

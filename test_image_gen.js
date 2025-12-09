import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyALCAzFj4uhk9OBxqp_4jftlMUztEhpQ5M";
const ai = new GoogleGenAI({ apiKey });

async function testImage() {
    const models = [
        'gemini-flash-latest'
    ];

    for (const model of models) {
        console.log(`Testing image gen with ${model}...`);
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [{ text: "A shiny red apple." }]
                }
            });

            console.log(`Success with ${model}`);
            // console.log(JSON.stringify(response, null, 2));

            // Check for image data
            const parts = response.candidates?.[0]?.content?.parts;
            if (parts && parts[0].inlineData) {
                console.log("Image data found!");
                return; // Found a working one
            } else {
                console.log("No inlineData in response.");
            }

        } catch (e) {
            console.log(`Failed with ${model}: ${e.message}`);
        }
    }
}

testImage();

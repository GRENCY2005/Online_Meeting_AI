require('dotenv').config();
const Groq = require('groq-sdk');

// Ensure you export the key properly otherwise the SDK crashes
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateSummary(transcriptText) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured in the backend .env file");
    }

    const prompt = `Analyze the following meeting transcript and generate:
1. Short summary
2. Key discussion points
3. Action items with responsible person if mentioned
4. Important decisions made

Transcript:
${transcriptText}

You MUST return your response as a valid JSON object matching this exact format:
{
  "summary": "The short summary text",
  "key_points": ["point 1", "point 2"],
  "action_items": ["item 1", "item 2"],
  "decisions": ["decision 1"]
}`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are an AI meeting assistant. Always output strictly valid JSON and nothing else."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2, // Low temperature for factual extraction
        response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Empty response from Groq");

    try {
        const parsed = JSON.parse(responseContent);
        return parsed;
    } catch (e) {
        throw new Error("Failed to parse Groq response into JSON: " + responseContent);
    }
}

module.exports = {
    generateSummary
};

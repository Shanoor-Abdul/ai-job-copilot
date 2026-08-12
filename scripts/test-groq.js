require('dotenv').config();
const { generateText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
});

async function test() {
  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: 'say hello',
    });
    console.log("Success:", text);
  } catch (err) {
    console.error("Error with Groq:", err.message);
  }
}

test();

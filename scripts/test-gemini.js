require('dotenv').config();
const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function test() {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash-latest'),
      prompt: 'say hello',
    });
    console.log("Success:", text);
  } catch (err) {
    console.error("Error with gemini-1.5-flash-latest:", err.message);
  }
}

test();

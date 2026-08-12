require('dotenv').config();
const { generateObject } = require('ai');
const { createGroq } = require('@ai-sdk/groq');
const { z } = require('zod');

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
});

const schema = z.object({
  personal: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable()
  })
});

async function test() {
  try {
    const { text } = await require('ai').generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: 'My name is John Doe. Extract my name. Output ONLY valid JSON matching this schema: { "personal": { "firstName": string, "lastName": string } }',
    });
    console.log("Success! Parsed object:", JSON.parse(text));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();

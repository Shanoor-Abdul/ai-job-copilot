import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
})

export const resumeExtractionSchema = z.object({
  personal: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
  }),
  professional: z.object({
    currentTitle: z.string().nullable(),
    yearsOfExperience: z.number().nullable(),
    professionalSummary: z.string().nullable(),
  }),
  skills: z.array(z.string()),
  achievements: z.array(z.string()),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    url: z.string().nullable(),
    technologies: z.array(z.string())
  })),
  education: z.array(
    z.object({
      degree: z.string().nullable(),
      institution: z.string().nullable(),
      fieldOfStudy: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    })
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string().nullable(),
      year: z.string().nullable(),
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      description: z.string().nullable(),
      technologies: z.array(z.string()),
    })
  ),
  links: z.object({
    linkedin: z.string().nullable(),
    github: z.string().nullable(),
    portfolio: z.string().nullable(),
    other: z.array(z.string()),
  }),
})

export type ParsedResumeData = z.infer<typeof resumeExtractionSchema>

const PROMPT_TEMPLATE = `
You are a resume information extraction system.

Extract only information explicitly present in the resume text provided below.

Do not invent:
- skills
- companies
- job titles
- education
- certifications
- dates
- years of experience
- locations
- URLs

If information is not present, return null or an empty array.
Normalize information where appropriate (e.g. standardizing skills or removing special characters from phone numbers), but preserve factual accuracy.

Calculate approximate total years of experience using structured dates from work experience if it makes sense.
Extract key personal, academic, or professional projects into the projects array.
Extract notable awards, recognition, or achievements into the achievements array.

OUTPUT STRICTLY VALID JSON. DO NOT WRAP IN MARKDOWN BLOCKS (e.g. \`\`\`json). JUST OUTPUT THE RAW JSON TEXT that matches this structure exactly:
{
  "personal": { "firstName": string | null, "lastName": string | null, "email": string | null, "phone": string | null, "location": string | null },
  "professional": { "currentTitle": string | null, "yearsOfExperience": number | null, "professionalSummary": string | null },
  "skills": string[],
  "achievements": string[],
  "projects": [ { "name": string, "description": string | null, "startDate": string | null, "endDate": string | null, "url": string | null, "technologies": string[] } ],
  "education": [ { "degree": string | null, "institution": string | null, "fieldOfStudy": string | null, "startDate": string | null, "endDate": string | null } ],
  "certifications": [ { "name": string, "issuer": string | null, "year": string | null } ],
  "experience": [ { "company": string, "title": string, "startDate": string | null, "endDate": string | null, "description": string | null, "technologies": string[] } ],
  "links": { "linkedin": string | null, "github": string | null, "portfolio": string | null, "other": string[] }
}

Resume Text:
---
`

export async function extractResumeData(text: string): Promise<ParsedResumeData> {
  const { text: responseText } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    prompt: PROMPT_TEMPLATE + text,
    temperature: 0,
  })

  // Clean the response just in case the model added markdown blocks
  const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
  
  try {
    return JSON.parse(cleanedText) as ParsedResumeData
  } catch (e) {
    console.error("Failed to parse JSON from AI:", cleanedText)
    throw new Error("AI failed to return valid structured data")
  }
}

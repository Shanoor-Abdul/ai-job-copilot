import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  title: z.string().trim().min(1).max(180),
  company: z.string().trim().min(1).max(180),
  location: z.string().trim().max(250).default(""),
  description: z.string().trim().max(12000).default(""),
});

const analysisSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  verdict: z.enum(["Strong fit", "Potential fit", "Low fit"]),
  summary: z.string().min(1).max(500),
  strengths: z.array(z.string().min(1).max(180)).max(5),
  gaps: z.array(z.string().min(1).max(180)).max(5),
  nextStep: z.string().min(1).max(300),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to use AI job analysis." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Claude is not configured yet. Add ANTHROPIC_API_KEY to your local .env file and restart the dev server." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsedRequest = requestSchema.safeParse(payload);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid job details. Please refresh and try again." }, { status: 400 });
  }

  const job = parsedRequest.data;
  const prompt = `Evaluate this job for a candidate with this target profile:
- Experienced frontend developer with approximately 8 years of experience
- Strong focus: React, Next.js, TypeScript, JavaScript, reusable UI systems, accessibility, performance, and responsive interfaces
- Preferred market: Riyadh / Saudi Arabia; remote roles may also be relevant
- Do not assume a skill, qualification, visa status, or achievement that is not in the supplied information

Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || "Not specified"}
Description:
${job.description || "No job description was supplied."}

Return only a JSON object with this exact shape:
{
  "fitScore": integer from 0 to 100,
  "verdict": "Strong fit" | "Potential fit" | "Low fit",
  "summary": "brief honest explanation",
  "strengths": ["up to 5 specific alignment points"],
  "gaps": ["up to 5 skills or requirements to verify"],
  "nextStep": "one practical action before applying"
}
Be evidence-based. If the description is missing or vague, lower confidence and state that in the summary. Do not invent requirements.`;

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 850,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach Claude. Check your connection and try again." }, { status: 502 });
  }

  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json({ error: "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in .env and restart the server." }, { status: 502 });
    }
    if (upstream.status === 429) {
      return NextResponse.json({ error: "Claude API rate or usage limit reached. Check your Anthropic API billing and limits." }, { status: 429 });
    }
    return NextResponse.json({ error: "Claude could not analyze this job right now. Please try again later." }, { status: 502 });
  }

  let responseBody: { content?: Array<{ type?: string; text?: string }> };
  try {
    responseBody = await upstream.json();
  } catch {
    return NextResponse.json({ error: "Claude returned an unreadable response." }, { status: 502 });
  }
  const textContent = responseBody.content?.find((item) => item.type === "text")?.text;
  if (!textContent) {
    return NextResponse.json({ error: "Claude returned an empty analysis." }, { status: 502 });
  }

  try {
    const cleaned = textContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const analysis = analysisSchema.parse(JSON.parse(cleaned));
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "Claude returned an unexpected analysis format. Please try again." }, { status: 502 });
  }
}

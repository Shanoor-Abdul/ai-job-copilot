import type { JobRecord } from "./types";

const TARGET_TERMS = [
  "react", "next.js", "nextjs", "frontend", "front-end", "front end",
  "typescript", "javascript", "ui engineer", "web developer", "tailwind"
];

export function scoreJob(job: Pick<JobRecord, "title" | "description" | "location_text" | "city" | "country">) {
  const title = (job.title || "").toLowerCase();
  const text = `${title} ${job.description || ""}`.toLowerCase();
  const location = `${job.location_text || ""} ${job.city || ""} ${job.country || ""}`.toLowerCase();
  const matched = TARGET_TERMS.filter((term) => text.includes(term));
  const reasons: string[] = [];
  let score = 0;

  const titleMatch = ["frontend", "front-end", "front end", "react", "next.js", "nextjs", "ui engineer"].some((t) => title.includes(t));
  if (titleMatch) { score += 38; reasons.push("Title aligns with frontend development"); }
  if (text.includes("react")) { score += 14; reasons.push("Mentions React"); }
  if (text.includes("typescript")) { score += 10; reasons.push("Mentions TypeScript"); }
  if (text.includes("next.js") || text.includes("nextjs")) { score += 10; reasons.push("Mentions Next.js"); }
  if (text.includes("javascript")) { score += 6; reasons.push("Mentions JavaScript"); }
  if (text.includes("tailwind")) { score += 4; reasons.push("Mentions Tailwind CSS"); }
  if (/\b(senior|lead|staff)\b/.test(title)) { score += 4; reasons.push("Potentially suitable seniority"); }
  if (location.includes("riyadh")) { score += 12; reasons.push("Located in Riyadh"); }
  else if (location.includes("saudi") || location.includes("jeddah") || location.includes("dammam") || location.includes("khobar")) {
    score += 8; reasons.push("Located in Saudi Arabia");
  }
  if (!location) reasons.push("Location needs verification");
  return { score: Math.min(100, score), reasons, matchedTerms: matched };
}

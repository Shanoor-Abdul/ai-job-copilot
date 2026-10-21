import type { NormalizedJob } from "./types";
import { createHash } from "node:crypto";

function htmlToText(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
function asDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function cityFromLocation(value: string | null) {
  if (!value) return null;
  const cities = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Dhahran", "Mecca", "Medina", "Tabuk", "Abha", "Dubai", "Abu Dhabi", "Sharjah", "Ajman"];
  return cities.find((city) => value.toLowerCase().includes(city.toLowerCase())) ?? null;
}
function countryFromLocation(value: string | null) {
  if (!value) return null;
  if (/saudi arabia|\bksa\b|riyadh|jeddah|dammam|khobar|dhahran|mecca|medina|tabuk|abha/i.test(value)) return "Saudi Arabia";
  if (/united arab emirates|\buae\b|dubai|abu dhabi|sharjah|ajman|ras al khaimah|fujairah/i.test(value)) return "United Arab Emirates";
  if (/india|bengaluru|bangalore|hyderabad|chennai|mumbai|pune|gurugram|gurgaon|noida|new delhi/i.test(value)) return "India";
  return null;
}
function isSaudi(value: string | null) { return countryFromLocation(value) === "Saudi Arabia"; }
function workplaceType(value: string | null) {
  if (!value) return null;
  if (/remote|work from home|anywhere/i.test(value)) return "remote";
  if (/hybrid/i.test(value)) return "hybrid";
  return null;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "SaudiJobCopilot/0.1 (personal job discovery)" }, signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error(`Source returned ${response.status}: ${url}`);
  return response.json();
}

export async function fetchGreenhouse(boardToken: string): Promise<NormalizedJob[]> {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.map((job: any) => {
    const location = job.location?.name ?? null;
    const description = htmlToText(job.content);
    const applyUrl = String(job.absolute_url || "");
    return {
      source: "greenhouse", sourceBoard: boardToken, externalId: String(job.id),
      companyName: String(data.name || boardToken), title: String(job.title || "Untitled role"),
      locationText: location, city: cityFromLocation(location), country: countryFromLocation(location),
      workplaceType: workplaceType(location),
      description, applyUrl, publishedAt: asDate(job.updated_at), sourceUpdatedAt: asDate(job.updated_at),
      isActive: Boolean(applyUrl), contentHash: hash(`${job.title}|${location}|${description}|${applyUrl}`)
    } satisfies NormalizedJob;
  }).filter((job: NormalizedJob) => job.applyUrl);
}

export async function fetchLever(site: string): Promise<NormalizedJob[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`);
  if (!Array.isArray(data)) return [];
  return data.map((job: any) => {
    const location = job.categories?.location ?? null;
    const description = htmlToText([job.description, job.additional, job.descriptionPlain].filter(Boolean).join(" "));
    const applyUrl = String(job.applyUrl || job.hostedUrl || "");
    const created = typeof job.createdAt === "number" ? new Date(job.createdAt).toISOString() : null;
    return {
      source: "lever", sourceBoard: site, externalId: String(job.id),
      companyName: String(job.textCompany || site), title: String(job.text || "Untitled role"),
      locationText: location, city: cityFromLocation(location), country: isSaudi(location) ? "Saudi Arabia" : null,
      workplaceType: /remote/i.test(location || "") ? "remote" : null,
      description, applyUrl, publishedAt: created, sourceUpdatedAt: created,
      isActive: Boolean(applyUrl), contentHash: hash(`${job.text}|${location}|${description}|${applyUrl}`)
    } satisfies NormalizedJob;
  }).filter((job: NormalizedJob) => job.applyUrl);
}

export async function fetchAshby(boardName: string): Promise<NormalizedJob[]> {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}?includeCompensation=true`);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.map((job: any) => {
    const primary = String(job.location || "");
    const secondary = Array.isArray(job.secondaryLocations) ? job.secondaryLocations.map((item: any) => item?.location).filter(Boolean).join("; ") : "";
    const location = [primary, secondary].filter(Boolean).join("; ") || null;
    const description = htmlToText(job.descriptionPlain || job.descriptionHtml || job.description);
    const applyUrl = String(job.applyUrl || job.jobUrl || "");
    const publishedAt = asDate(job.publishedAt);
    return { source: "ashby", sourceBoard: boardName, externalId: String(job.id || job.jobId || applyUrl),
      companyName: String(job.companyName || job.department || boardName), title: String(job.title || "Untitled role"),
      locationText: location, city: cityFromLocation(primary), country: countryFromLocation(primary),
      workplaceType: job.isRemote ? "remote" : workplaceType(primary), description, applyUrl, publishedAt, sourceUpdatedAt: publishedAt,
      isActive: Boolean(applyUrl), contentHash: hash(`${job.title}|${location}|${description}|${applyUrl}`) } satisfies NormalizedJob;
  }).filter((job: NormalizedJob) => job.applyUrl && job.externalId);
}

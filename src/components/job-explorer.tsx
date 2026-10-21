"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import type { JobRecord } from "@/lib/jobs/types";

type Job = Pick<JobRecord, "id" | "source" | "title" | "company_name" | "location_text" | "country" | "city" | "description" | "apply_url" | "published_at">;
const PAGE_SIZE = 12;
const SUGGESTED_SKILLS = ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Node.js", "Angular", "Vue.js", "HTML", "CSS", "Redux", "GraphQL", "REST APIs", "Python", "Java", "SQL", "PostgreSQL", "AWS", "Docker", "Git"];

function timeAgo(date: string | null) {
  if (!date) return "Date not provided";
  const parsed = new Date(date).getTime();
  if (Number.isNaN(parsed)) return "Date not provided";
  const days = Math.max(0, Math.floor((Date.now() - parsed) / 86400000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}
function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9+#.]/g, ""); }
function skillAppears(text: string, skill: string) {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}
function score(job: Job, skills: string[]) {
  const title = job.title || "";
  const text = `${title} ${job.description || ""}`;
  const matched = skills.filter((skill) => skillAppears(text, skill));
  const titleMatches = skills.filter((skill) => skillAppears(title, skill));
  const location = `${job.location_text || ""} ${job.country || ""} ${job.city || ""}`;
  const roleBonus = /front.?end|react|web developer|software engineer|ui engineer/i.test(title) ? 15 : 0;
  const saudiBonus = /saudi|riyadh|jeddah|dammam|khobar|dhahran/i.test(location) ? 10 : 0;
  const points = skills.length ? Math.round(Math.min(75, matched.length / skills.length * 75) + Math.min(15, titleMatches.length * 5) + roleBonus + saudiBonus) : Math.min(100, roleBonus + saudiBonus);
  return { score: Math.min(100, points), matched };
}

export function JobExplorer({ jobs, initialTechStack }: { jobs: Job[]; initialTechStack: string[] }) {
  const [skills, setSkills] = useState(initialTechStack);
  const [draftSkill, setDraftSkill] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("match");
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function persistSkills(next: string[]) {
    setSkills(next);
    setPage(1);
    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ techStack: next }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not save skills.");
      setSaveMessage("Saved");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save skills.");
    } finally {
      setSaving(false);
    }
  }
  function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const skill = draftSkill.trim().replace(/\s+/g, " ").slice(0, 50);
    if (!skill || skills.some((item) => normalize(item) === normalize(skill)) || skills.length >= 50) return;
    setDraftSkill("");
    void persistSkills([...skills, skill]);
  }
  function removeSkill(skill: string) {
    void persistSkills(skills.filter((item) => item !== skill));
  }

  const scored = useMemo(() => jobs.map((job) => ({ job, ...score(job, skills) })), [jobs, skills]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    return scored.filter(({ job, matched }) => {
      const searchable = `${job.title} ${job.company_name} ${job.description || ""} ${job.location_text || ""}`.toLowerCase();
      return (!term || searchable.includes(term))
        && (!place || `${job.location_text || ""} ${job.country || ""} ${job.city || ""}`.toLowerCase().includes(place))
        && (source === "all" || job.source === source)
        && (!matchedOnly || matched.length > 0);
    }).sort((a, b) => sort === "newest"
      ? new Date(b.job.published_at || 0).getTime() - new Date(a.job.published_at || 0).getTime()
      : b.score - a.score);
  }, [scored, query, location, source, sort, matchedOnly]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return <div className="space-y-4">
    <div className="rounded-xl border border-white/[0.08] bg-[#0d111b] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-medium">Your technology stack</h3><p className="mt-1 text-xs leading-5 text-slate-500">Add or remove skills to personalize matching. Changes are saved to your profile.</p></div>
        <span className="text-xs text-slate-500">{saving ? "Saving…" : saveMessage}</span>
      </div>
      <form onSubmit={addSkill} className="mt-3 flex gap-2">
        <input value={draftSkill} onChange={(event) => setDraftSkill(event.target.value)} maxLength={50} placeholder="Add any technology, e.g. Vue.js" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-violet-400/50" />
        <button type="submit" disabled={!draftSkill.trim() || skills.length >= 50} className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Add skill</button>
      </form>
      {skills.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/15 bg-violet-400/[0.07] px-2.5 py-1.5 text-xs text-violet-100">{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => removeSkill(skill)} className="text-violet-300 hover:text-white"><X size={12}/></button></span>)}</div> : <p className="mt-3 text-xs text-amber-300">Add your skills to get personalized match scores.</p>}
      <div className="mt-4 border-t border-white/[0.06] pt-3"><p className="mb-2 text-[11px] text-slate-500">Quick add</p><div className="flex flex-wrap gap-2">{SUGGESTED_SKILLS.filter((skill) => !skills.some((item) => normalize(item) === normalize(skill))).slice(0, 12).map((skill) => <button key={skill} type="button" onClick={() => void persistSkills([...skills, skill])} className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-slate-400 hover:border-violet-300/30 hover:text-white">+ {skill}</button>)}</div></div>
    </div>

    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto_auto]">
      <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d111b] px-3"><Search size={16} className="shrink-0 text-slate-500"/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search jobs, companies or skills" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"/></label>
      <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d111b] px-3"><MapPin size={15} className="text-slate-500"/><input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} placeholder="Location" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"/></label>
      <select value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }} aria-label="Filter by source" className="rounded-xl border border-white/[0.08] bg-[#0d111b] px-3 py-3 text-xs text-slate-300"><option value="all">All sources</option><option value="greenhouse">Greenhouse</option><option value="lever">Lever</option><option value="other">Other</option><option value="company_career">Company careers</option></select>
      <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort jobs" className="rounded-xl border border-white/[0.08] bg-[#0d111b] px-3 py-3 text-xs text-slate-300"><option value="match">Best match</option><option value="newest">Newest</option></select>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><span>{filtered.length} jobs · {skills.length} profile skills</span><button type="button" onClick={() => { setMatchedOnly(!matchedOnly); setPage(1); }} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${matchedOnly ? "border-violet-300/30 bg-violet-400/10 text-violet-200" : "border-white/10 text-slate-400"}`}><SlidersHorizontal size={13}/>{matchedOnly ? "Showing skill matches" : "Show skill matches only"}</button></div>
    {visible.length === 0 ? <div className="rounded-xl border border-dashed border-white/[0.1] p-10 text-center"><p className="text-sm font-medium">No jobs match these filters</p><p className="mt-1 text-xs text-slate-500">Try another keyword or location, or show all jobs.</p><button type="button" onClick={() => { setQuery(""); setLocation(""); setSource("all"); setMatchedOnly(false); setPage(1); }} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs">Clear filters</button></div> : <div className="grid gap-3 xl:grid-cols-2">{visible.map(({ job, score: matchScore, matched }) => <article key={job.id} className="rounded-xl border border-white/[0.08] bg-[#0d111b] p-4 transition hover:border-violet-300/25"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-slate-300">{job.company_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium">{job.title}</h3><p className="mt-1 text-xs text-slate-400">{job.company_name}</p></div><span className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-xs font-semibold text-emerald-300">{matchScore}% match</span></div><div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={12}/>{job.location_text || "Location not specified"}</span><span>{timeAgo(job.published_at)}</span><span className="capitalize">{job.source.replace("_", " ")}</span></div>{matched.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{matched.slice(0, 6).map((skill) => <span key={skill} className="rounded-md bg-violet-400/[0.08] px-2 py-1 text-[10px] text-violet-200">{skill}</span>)}</div>}<div className="mt-3 flex items-center justify-end border-t border-white/[0.06] pt-3"><a target="_blank" rel="noreferrer" href={job.apply_url} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">View job <ArrowUpRight size={13}/></a></div></div></div></article>)}</div>}
    {filtered.length > PAGE_SIZE && <div className="flex items-center justify-center gap-3 pt-2"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-40"><ChevronLeft size={14}/>Previous</button><span className="text-xs text-slate-500">Page {currentPage} of {pageCount}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-40">Next<ChevronRight size={14}/></button></div>}
  </div>;
}

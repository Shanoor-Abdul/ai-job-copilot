import {
  Activity, ArrowUpRight, Bell, BriefcaseBusiness, CheckCircle2, ChevronDown,
  CircleHelp, FileText, Filter, LayoutDashboard, MapPin, Search, Settings2,
  Sparkles, Target, TrendingUp, UploadCloud, Zap
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreJob } from "@/lib/jobs/scoring";
import type { JobRecord } from "@/lib/jobs/types";

async function getJobs(): Promise<JobRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("published_at", { ascending: false, nullsFirst: false }).limit(100);
    return (data ?? []) as JobRecord[];
  } catch {
    return [];
  }
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }
function timeAgo(date: string | null) {
  if (!date) return "Date not provided";
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

export default async function Home() {
  const jobs = (await getJobs()).map((job) => ({ ...job, match: scoreJob(job) })).sort((a, b) => b.match.score - a.match.score);
  const saudiJobs = jobs.filter((j) => /saudi|riyadh|jeddah|dammam|khobar|dhahran|mecca|medina/i.test(`${j.country || ""} ${j.location_text || ""}`));
  const strongMatches = saudiJobs.filter((j) => j.match.score >= 65);
  const sourceCount = new Set(jobs.map((j) => j.source)).size;

  return <main className="min-h-screen bg-[#080b12] text-slate-100">
    <div className="flex min-h-screen">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0b0e16] px-5 py-6 lg:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/40"><Sparkles size={21}/></div>
          <div><div className="font-semibold tracking-tight">Saudi Copilot</div><div className="mt-0.5 text-[11px] text-slate-500">PERSONAL WORKSPACE</div></div>
        </div>
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</div>
        <nav className="space-y-1 text-sm">
          <a className="flex items-center gap-3 rounded-xl border border-violet-400/15 bg-violet-500/10 px-3 py-3 font-medium text-violet-200" href="#"><LayoutDashboard size={17}/> Overview <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400"/></a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 transition hover:bg-white/[0.04] hover:text-white" href="#jobs"><BriefcaseBusiness size={17}/> Discover jobs</a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 transition hover:bg-white/[0.04] hover:text-white" href="#applications"><FileText size={17}/> Applications <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px]">0</span></a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 transition hover:bg-white/[0.04] hover:text-white" href="#profile"><Target size={17}/> My profile</a>
        </nav>
        <div className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Preferences</div>
        <nav className="space-y-1 text-sm">
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 hover:bg-white/[0.04]" href="#sources"><Activity size={17}/> Data sources</a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 hover:bg-white/[0.04]" href="#settings"><Settings2 size={17}/> Settings</a>
        </nav>
        <div className="mt-auto rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-indigo-500/[0.03] p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200"><Zap size={16}/></div>
          <div className="text-sm font-medium">Your next opportunity</div>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">Connect job sources to discover roles that fit your skills.</p>
          <a href="#sources" className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-300">Configure sources <ArrowUpRight size={13}/></a>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold">SA</div>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">Your workspace</div><div className="text-xs text-slate-500">Personal account</div></div>
          <CircleHelp size={16} className="text-slate-500"/>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5 md:px-9">
          <div><div className="text-xs text-slate-500">Workspace <span className="px-1.5">/</span> <span className="text-slate-300">Overview</span></div><div className="mt-1 text-sm font-medium">Your job search, in one place</div></div>
          <div className="flex items-center gap-3"><button aria-label="Notifications" className="relative rounded-xl border border-white/[0.08] p-2.5 text-slate-400 hover:text-white"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400"/></button><div className="hidden h-8 w-px bg-white/10 sm:block"/><div className="hidden text-right sm:block"><div className="text-xs font-medium">Saudi Arabia</div><div className="text-[11px] text-slate-500">Riyadh · GMT+3</div></div><div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-300/20 bg-violet-500/15 text-xs font-semibold text-violet-200">SA</div></div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-7 p-5 md:p-9">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-[11px] font-medium text-violet-200"><Sparkles size={13}/> AI-powered job discovery</div><h1 className="text-3xl font-semibold tracking-tight md:text-[34px]">Good afternoon<span className="text-violet-300">.</span></h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Your next career move starts here. Find the right frontend opportunities across Saudi Arabia.</p></div>
            <a href="#jobs" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold shadow-lg shadow-violet-950/30 transition hover:bg-violet-400"><Search size={16}/> Explore opportunities <ArrowUpRight size={15}/></a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={<BriefcaseBusiness size={17}/>} label="Active jobs indexed" value={String(jobs.length)} detail="Across connected sources" color="violet"/>
            <Stat icon={<MapPin size={17}/>} label="Saudi opportunities" value={String(saudiJobs.length)} detail="Location identified from source" color="blue"/>
            <Stat icon={<Target size={17}/>} label="Strong matches" value={String(strongMatches.length)} detail="65+ relevance score" color="green"/>
            <Stat icon={<TrendingUp size={17}/>} label="Sources connected" value={String(sourceCount)} detail="Live configured sources" color="amber"/>
          </div>

          <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-[#111323] p-5 md:p-7">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl"/>
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div><div className="flex items-center gap-2 text-xs font-medium text-violet-300"><Sparkles size={14}/> YOUR COPILOT PROFILE</div><h2 className="mt-3 text-xl font-semibold">Built around your tech stack</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">Prioritize React, Next.js and TypeScript roles in Riyadh. Match scores are currently based on transparent keyword and location signals.</p><div className="mt-5 flex flex-wrap gap-2">{["React","Next.js","TypeScript","JavaScript","Tailwind CSS","Frontend"].map((skill)=><span key={skill} className="rounded-lg border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-xs text-slate-300">{skill}</span>)}</div></div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">Profile readiness</span><span className="text-xs font-medium text-amber-300">Setup needed</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full w-[38%] rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"/></div><div className="mt-4 space-y-3"><ProfileCheck done label="Target roles selected"/><ProfileCheck done label="Saudi location preference"/><ProfileCheck label="Upload your latest resume"/><ProfileCheck label="Connect job sources"/></div><a href="#profile" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs font-medium hover:bg-white/[0.04]">Complete profile <ArrowUpRight size={13}/></a></div>
            </div>
          </section>

          <section id="jobs" className="scroll-mt-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-lg font-semibold">Recommended opportunities</h2><p className="mt-1 text-xs text-slate-500">Ranked for your frontend stack and Saudi location preferences.</p></div><button className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04]"><Filter size={14}/> Filters <ChevronDown size={13}/></button></div>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0d111b] px-4 py-3"><Search size={17} className="shrink-0 text-slate-500"/><input id="job-search" placeholder="Search titles, companies or skills..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/><kbd className="hidden rounded border border-white/10 px-1.5 py-1 text-[10px] text-slate-500 sm:block">⌘ K</kbd></div>
            {jobs.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.015] px-6 py-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-500/[0.08] text-violet-300"><BriefcaseBusiness size={24}/></div><h3 className="mt-4 text-base font-semibold">Your job feed is ready to be connected</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">No live jobs have been imported yet. Configure authorized Greenhouse or Lever board identifiers and run the first sync to populate this feed with source-backed listings.</p><a href="#sources" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-200">Set up job sources <ArrowUpRight size={14}/></a></div> :
              <div className="grid gap-3 xl:grid-cols-2">{jobs.slice(0,12).map((job)=><article key={job.id} className="rounded-xl border border-white/[0.08] bg-[#0d111b] p-4 transition hover:border-violet-300/25"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-slate-300">{initials(job.company_name)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium">{job.title}</h3><p className="mt-1 text-xs text-slate-400">{job.company_name}</p></div><div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-xs font-semibold text-emerald-300">{job.match.score}% match</div></div><div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={12}/>{job.location_text || "Location not specified"}</span><span>{timeAgo(job.published_at)}</span><span className="capitalize">{job.source}</span></div><div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="text-[11px] text-slate-500">{job.match.reasons.slice(0,2).join(" · ") || "Review match details"}</span><a target="_blank" rel="noreferrer" href={job.apply_url} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">View job <ArrowUpRight size={13}/></a></div></div></div></article>)}</div>}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section id="sources" className="scroll-mt-6 rounded-2xl border border-white/[0.08] bg-[#0d111b] p-5 md:p-6">
              <div className="flex items-start justify-between"><div><h2 className="font-semibold">Job data sources</h2><p className="mt-1 text-xs text-slate-500">Connect public, authorized listings</p></div><div className="rounded-lg border border-white/[0.08] p-2 text-slate-400"><Activity size={17}/></div></div>
              <div className="mt-5 space-y-3">
                <SourceRow name="Greenhouse" description="Public job board API" tag={process.env.GREENHOUSE_BOARD_TOKENS ? "Configured" : "Needs setup"} />
                <SourceRow name="Lever" description="Public postings API" tag={process.env.LEVER_SITE_NAMES ? "Configured" : "Needs setup"} />
                <SourceRow name="Company career pages" description="Add per-company approved connectors" tag="Planned"/>
                <SourceRow name="LinkedIn and other platforms" description="Official or otherwise authorized integrations only" tag="Restricted"/>
              </div>
              <p className="mt-4 rounded-lg bg-white/[0.03] p-3 text-[11px] leading-5 text-slate-500">Source configuration is server-side. Do not add secrets to browser code. This starter does not scrape LinkedIn.</p>
            </section>
            <section id="applications" className="scroll-mt-6 rounded-2xl border border-white/[0.08] bg-[#0d111b] p-5 md:p-6">
              <div className="flex items-start justify-between"><div><h2 className="font-semibold">Application pipeline</h2><p className="mt-1 text-xs text-slate-500">Keep every application organized</p></div><div className="rounded-lg border border-white/[0.08] p-2 text-slate-400"><FileText size={17}/></div></div>
              <div className="mt-5 grid grid-cols-2 gap-3">{[["Saved","0"],["Ready to review","0"],["Submitted","0"],["Interviews","0"]].map(([label,value])=><div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}</div>
              <div className="mt-4 flex gap-3 rounded-xl border border-dashed border-white/[0.1] p-4"><div className="mt-0.5 text-violet-300"><CheckCircle2 size={17}/></div><div><div className="text-sm font-medium">Review-first application flow</div><p className="mt-1 text-xs leading-5 text-slate-500">The database supports application tracking. Submission integrations remain disabled until the platform and approval safeguards are implemented.</p></div></div>
            </section>
          </div>

          <section id="profile" className="scroll-mt-6 rounded-2xl border border-white/[0.08] bg-[#0d111b] p-5 md:p-6">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-white/[0.04] p-2.5 text-slate-300"><UploadCloud size={19}/></div><div><h2 className="font-semibold">Your career profile</h2><p className="mt-1 text-xs text-slate-500">Resume upload and profile persistence are the next integration step.</p></div></div>
            <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-dashed border-white/[0.12] p-5 sm:flex-row sm:items-center"><div><div className="text-sm font-medium">Add your latest resume</div><p className="mt-1 text-xs text-slate-500">PDF or DOCX · Keep your personal information private.</p></div><span className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400"><UploadCloud size={14}/> Upload not connected</span></div>
          </section>
          <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-[11px] text-slate-600 sm:flex-row"><span>Saudi Job Copilot · Personal workspace</span><span>Source-backed listings · Review-first applications</span></footer>
        </div>
      </section>
    </div>
  </main>;
}

function Stat({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  const styles: Record<string, string> = { violet: "bg-violet-400/10 text-violet-300", blue: "bg-sky-400/10 text-sky-300", green: "bg-emerald-400/10 text-emerald-300", amber: "bg-amber-400/10 text-amber-300" };
  return <div className="rounded-2xl border border-white/[0.08] bg-[#0d111b] p-4"><div className="flex items-start justify-between"><div className="text-xs text-slate-400">{label}</div><div className={`rounded-lg p-2 ${styles[color]}`}>{icon}</div></div><div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[11px] text-slate-500">{detail}</div></div>;
}
function ProfileCheck({ done = false, label }: { done?: boolean; label: string }) {
  return <div className="flex items-center gap-2.5 text-xs"><span className={`flex h-4 w-4 items-center justify-center rounded-full ${done ? "bg-emerald-400/15 text-emerald-300" : "border border-white/15 text-transparent"}`}>{done && <CheckCircle2 size={12}/>}</span><span className={done ? "text-slate-300" : "text-slate-500"}>{label}</span></div>;
}
function SourceRow({ name, description, tag }: { name: string; description: string; tag: string }) {
  const positive = tag === "Configured";
  return <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-semibold text-slate-300">{name.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="text-sm font-medium">{name}</div><div className="mt-0.5 text-[11px] text-slate-500">{description}</div></div><span className={`rounded-md px-2 py-1 text-[10px] ${positive ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-slate-500"}`}>{tag}</span></div>;
}

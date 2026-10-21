import { LoaderCircle, Sparkles } from "lucide-react";

export default function DashboardLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-slate-100" role="status" aria-live="polite"><div className="flex flex-col items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200"><Sparkles size={22}/></span><LoaderCircle className="animate-spin text-violet-300" size={24}/><p className="text-sm text-slate-400">Loading your job workspace…</p></div></main>;
}

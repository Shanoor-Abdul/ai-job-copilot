import { LoaderCircle, Sparkles } from "lucide-react";

export default function Loading() {
  return <main className="flex min-h-[55vh] items-center justify-center bg-[#080b12] px-5 text-slate-100" role="status" aria-live="polite"><div className="flex flex-col items-center gap-4 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200"><Sparkles size={23}/></div><LoaderCircle size={22} className="animate-spin text-violet-300"/><p className="text-sm text-slate-400">Loading your workspace…</p></div></main>;
}

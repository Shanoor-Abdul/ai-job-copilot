"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

type JobForAnalysis = {
  title: string;
  company: string;
  location: string;
  description: string;
};

type Analysis = {
  fitScore: number;
  verdict: "Strong fit" | "Potential fit" | "Low fit";
  summary: string;
  strengths: string[];
  gaps: string[];
  nextStep: string;
};

export function AIJobAnalysis({ job }: { job: JobForAnalysis }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(job),
      });
      const body = await response.json() as { analysis?: Analysis; error?: string };
      if (!response.ok) throw new Error(body.error || "AI analysis failed.");
      if (!body.analysis) throw new Error("No analysis was returned.");
      setAnalysis(body.analysis);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <button type="button" onClick={analyze} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-violet-400/20 bg-violet-400/[0.06] px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-400/[0.12] disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? "Analyzing with Claude…" : analysis ? "Run AI analysis again" : "Analyze fit with AI"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs leading-5 text-rose-200">{error}</p>}
      {analysis && (
        <div className="mt-3 rounded-xl border border-violet-400/15 bg-violet-400/[0.035] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-violet-200">Claude job-fit analysis</span>
            <span className="rounded-lg border border-violet-400/20 px-2.5 py-1 text-xs font-semibold text-violet-100">{analysis.fitScore}% · {analysis.verdict}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">{analysis.summary}</p>
          {analysis.strengths.length > 0 && <div className="mt-3"><h4 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Potential strengths</h4><ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-400">{analysis.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          {analysis.gaps.length > 0 && <div className="mt-3"><h4 className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">Check before applying</h4><ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-400">{analysis.gaps.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          <p className="mt-3 rounded-lg bg-black/20 p-3 text-xs leading-5 text-slate-300"><span className="font-semibold text-violet-200">Suggested next step: </span>{analysis.nextStep}</p>
          <p className="mt-2 text-[10px] leading-4 text-slate-600">AI estimates are guidance, not a hiring prediction. This version uses your target profile, not the contents of your uploaded resume.</p>
        </div>
      )}
    </div>
  );
}

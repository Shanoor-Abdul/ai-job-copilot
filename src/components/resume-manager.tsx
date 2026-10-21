"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileText, LoaderCircle, LogOut, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type SavedResume = {
  fileName: string;
  downloadUrl: string;
};

type ApiResponse = {
  error?: string;
  message?: string;
  resume?: SavedResume | null;\n  displayName?: string | null;\n  email?: string | null;
};

export function ResumeManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<SavedResume | null>(null);\n  const [displayName, setDisplayName] = useState("");\n  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profile/resume", { cache: "no-store" });
      const body = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        setSignedIn(false);
        setResume(null);
        return;
      }
      if (!response.ok) throw new Error(body.error || "Could not load your resume.");

      setSignedIn(true);
      setResume(body.resume ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your resume.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function uploadResume(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setBusy(true);

    try {
      const response = await fetch("/api/profile/resume", { method: "POST", body: formData });
      const body = (await response.json()) as ApiResponse;
      if (!response.ok) throw new Error(body.error || "Resume upload failed.");

      setMessage(body.message || "Resume uploaded successfully.");
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Resume upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteResume() {
    if (!window.confirm("Delete your saved resume? This cannot be undone.")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/resume", { method: "DELETE" });
      const body = (await response.json()) as ApiResponse;
      if (!response.ok) throw new Error(body.error || "Resume deletion failed.");

      setResume(null);
      setMessage(body.message || "Resume deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Resume deletion failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSignedIn(false);
      setResume(null);
      setMessage("You have been signed out.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="profile" className="scroll-mt-6 rounded-2xl border border-white/[0.08] bg-[#0d111b] p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/[0.04] p-2.5 text-slate-300"><UploadCloud size={19} /></div>
          <div>
            <h2 className="font-semibold">Your career profile</h2>
            <p className="mt-1 text-xs text-slate-500">Upload and privately manage the resume you use for applications.</p>
          </div>
        </div>
        {signedIn && (
          <button type="button" onClick={signOut} disabled={busy} className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50">
            <LogOut size={13} /> Sign out
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.07] p-4 text-sm text-slate-400"><LoaderCircle size={16} className="animate-spin" /> Checking your account and saved resume…</div>
      ) : !signedIn ? (
        <div className="mt-5 rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-5">
          <h3 className="text-sm font-medium">Sign in to upload your resume</h3>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">Create a personal account so your resume is stored privately and linked to your profile.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-lg bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-400">Sign in</Link>
            <Link href="/register" className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/[0.04]">Create account</Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {resume ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-emerald-400/10 p-2.5 text-emerald-300"><FileText size={18} /></div>
                <div className="min-w-0"><div className="truncate text-sm font-medium">{resume.fileName}</div><div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-300"><CheckCircle2 size={12} /> Saved in private storage</div></div>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={resume.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.04]"><Download size={13} /> Open</a>
                <button type="button" onClick={deleteResume} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/[0.06] disabled:opacity-50"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.12] p-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/[0.08] text-violet-300"><UploadCloud size={20} /></div>
              <h3 className="mt-3 text-sm font-medium">No resume uploaded yet</h3>
              <p className="mt-1 text-xs text-slate-500">Choose a PDF or DOCX file to get started.</p>
            </div>
          )}

          <form onSubmit={uploadResume} className="rounded-xl border border-white/[0.07] bg-black/10 p-4">
            <label htmlFor="resume-file" className="mb-2 block text-xs font-medium text-slate-300">{resume ? "Replace your resume" : "Select resume"}</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input ref={inputRef} id="resume-file" name="file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required className="min-w-0 flex-1 text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-200 hover:file:bg-white/[0.12]" />
              <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                {busy ? "Working…" : resume ? "Upload replacement" : "Upload resume"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">PDF or DOCX · Maximum 5 MB. Your file is not publicly accessible.</p>
          </form>
        </div>
      )}

      {message && <p role="status" className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5 text-xs text-emerald-200">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] px-3 py-2.5 text-xs leading-5 text-rose-200">{error}</p>}
    </section>
  );
}

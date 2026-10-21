"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, LoaderCircle, LogOut, Trash2, UploadCloud, ExternalLink, X, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type SavedResume = {
  fileName: string;
  downloadUrl: string;
};

type ApiResponse = {
  error?: string;
  message?: string;
  resume?: SavedResume | null;
  displayName?: string | null;
  email?: string | null;
};

export function ResumeManager() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<SavedResume | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openingResume, setOpeningResume] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        setDisplayName("");
        setEmail("");
        return;
      }
      if (!response.ok) throw new Error(body.error || "Could not load your resume.");

      setSignedIn(true);
      setResume(body.resume ?? null);
      setDisplayName(body.displayName || "");
      setEmail(body.email || "");
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

  async function openResume() {
    setOpeningResume(true);
    setError("");
    try {
      const response = await fetch("/api/profile/resume", { cache: "no-store" });
      const body = (await response.json()) as ApiResponse;
      if (!response.ok || !body.resume?.downloadUrl) throw new Error(body.error || "Could not create a fresh resume link.");
      setPreviewUrl(body.resume.downloadUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open your resume.");
    } finally {
      setOpeningResume(false);
    }
  }

  useEffect(() => {
    if (!previewUrl) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewUrl(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [previewUrl]);

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSignedIn(false);
      setResume(null);
      setDisplayName("");
      setEmail("");
      setMessage("You have been signed out.");
      router.replace("/");
      router.refresh();
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
            <h2 className="font-semibold">{signedIn && displayName ? `Welcome, ${displayName}` : "Your career profile"}</h2>
            <p className="mt-1 text-xs text-slate-500">{signedIn ? `${email || "Signed in"} · Manage your private resume and job search.` : "Upload and privately manage the resume you use for applications."}</p>
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
                <button type="button" onClick={openResume} disabled={openingResume || busy} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.04] disabled:opacity-60">{openingResume ? <LoaderCircle size={13} className="animate-spin" /> : <ExternalLink size={13} />} {openingResume ? "Opening…" : "Open"}</button>
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

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Resume preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewUrl(null);
          }}
        >
          <div className="flex h-[min(92vh,1000px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d111b] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={17} className="shrink-0 text-violet-300" />
                <div className="truncate text-sm font-medium">Resume preview</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={previewUrl} download={resume?.fileName || "resume"} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]">
                  <Download size={13} /> Download
                </a>
                <button type="button" onClick={() => setPreviewUrl(null)} aria-label="Close resume preview" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/[0.06] hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>
            {resume?.fileName.toLowerCase().endsWith(".pdf") ? (
              <iframe title="Resume PDF preview" src={previewUrl} className="min-h-0 flex-1 bg-white" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <FileText size={36} className="text-violet-300" />
                <h3 className="mt-4 text-base font-semibold">DOCX preview isn’t supported in this browser view</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">You can download your Word resume, or close this preview and upload a PDF to view it directly here.</p>
                <a href={previewUrl} download={resume?.fileName || "resume.docx"} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">
                  <Download size={15} /> Download resume
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {message && <p role="status" className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5 text-xs text-emerald-200">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] px-3 py-2.5 text-xs leading-5 text-rose-200">{error}</p>}
    </section>
  );
}

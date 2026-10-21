"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const isRegister = mode === "register";

  async function resendConfirmation() {
    if (!confirmationEmail) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (resendError) throw resendError;
      setNotice("Confirmation email requested. Check your inbox and spam/junk folder.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend confirmation email.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();

      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (authError) throw authError;

        if (!data.session) {
          setConfirmationEmail(email.trim());
          setNotice("Your account was created, but email confirmation is still required by Supabase. Check spam/junk, or resend the confirmation email below.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) throw authError;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-4 py-10 text-slate-100">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft size={15} /> Back to job dashboard
        </Link>
        <div className="rounded-2xl border border-white/[0.09] bg-[#0d111b] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <Sparkles size={21} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{isRegister ? "Create your workspace" : "Welcome back"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isRegister ? "Create an account to keep your resume private and manage your job search." : "Sign in to manage your private resume and job-search profile."}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {isRegister && (
              <label className="block space-y-2 text-sm">
                <span className="text-slate-300">Full name <span className="text-slate-500">(optional)</span></span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={100} className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 outline-none transition focus:border-violet-400/60" placeholder="Your name" />
              </label>
            )}
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Email address</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required maxLength={254} className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 outline-none transition focus:border-violet-400/60" placeholder="you@example.com" />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} required className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 outline-none transition focus:border-violet-400/60" placeholder="At least 8 characters" />
            </label>

            {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-sm text-rose-200">{error}</p>}
            {notice && <div role="status" className="space-y-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2.5 text-sm leading-5 text-emerald-200"><p>{notice}</p>{isRegister && confirmationEmail && <button type="button" onClick={resendConfirmation} disabled={busy} className="font-semibold underline underline-offset-4 disabled:opacity-50">Resend confirmation email</button>}</div>}

            <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60">
              {busy && <LoaderCircle size={16} className="animate-spin" />}
              {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? "Already have an account?" : "New to Saudi Job Copilot?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} className="font-medium text-violet-300 hover:text-violet-200">
              {isRegister ? "Sign in" : "Create account"}
            </Link>
          </p>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-600">Your resume is stored privately and is only accessible through your authenticated account.</p>
      </div>
    </main>
  );
}

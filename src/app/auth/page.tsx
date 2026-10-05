"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/button";

type Mode = "signin" | "signup";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/dashboard";
  const [mode, setMode] = useState<Mode>(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    // Frontend-only: the backend is not wired yet, so any valid submit lands
    // on the dashboard. Replace this with the real auth mutation later.
    window.setTimeout(() => {
      router.push(returnTo);
    }, 600);
  }

  function continueWithGoogle() {
    // Demo mode mirrors the email flow for now. Real Google OAuth replaces
    // this once GOOGLE_CLIENT_ID/SECRET are wired on the backend.
    setLoading(true);
    window.setTimeout(() => {
      router.push(returnTo);
    }, 600);
  }

  const isSignup = mode === "signup";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-brand-950 p-12 text-clay-50 lg:flex lg:flex-col lg:justify-between">
        <div className="relative">
          <span className="inline-flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10">
              <Stethoscope className="size-5 text-brand-200" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Aarogya Voice
            </span>
          </span>
        </div>

        <div className="relative">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            Every call answered.
            <br />
            Every patient in the queue.
          </h2>
          <p className="mt-4 max-w-sm text-brand-100/70">
            The reception desk keeps working when the receptionist cannot.
            Aarogya Voice answers, updates the queue, and books the slot.
          </p>

          <div className="mt-10 max-w-sm rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand-300" />
              <span className="text-xs font-medium tracking-[0.14em] text-brand-100/80 uppercase">
                Handling a call now
              </span>
            </div>
            <p className="mt-4 text-sm text-brand-50/90">
              “Your token is 9 — about 12 minutes. Shall I book 11:00 AM?”
            </p>
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-brand-100/60">
          <ShieldCheck className="size-4" />
          Clinic data stays isolated, one clinic per workspace.
        </p>
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Logo className="lg:hidden" />

          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-ink-900 lg:mt-0">
            {isSignup ? "Start your 14-day trial" : "Welcome back"}
          </h1>
          <p className="mt-2 text-ink-600">
            {isSignup
              ? "No credit card required. Your phone number is assigned within an hour."
              : "Sign in to manage your clinic, queue, and appointments."}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {isSignup && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Doctor name" placeholder="Dr. Ananya Sharma" />
                <Field label="Clinic name" placeholder="Aarogya Dental Care" />
              </div>
            )}

            <Field
              label="Email"
              type="email"
              placeholder="you@clinic.com"
              required
            />
            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
            />

            <Button type="submit" size="lg" className="group w-full" disabled={loading}>
              {loading
                ? "Please wait…"
                : isSignup
                  ? "Create clinic workspace"
                  : "Sign in"}
              {!loading && (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-xs text-ink-400">
            <span className="h-px flex-1 bg-ink-200" />
            or
            <span className="h-px flex-1 bg-ink-200" />
          </div>

          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-800 transition-colors hover:bg-ink-900/[0.03] disabled:opacity-60"
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.6c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4l-.01-.15-3.7-2.8-.12.06C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.3l3.8-2.9z"
              />
              <path
                fill="#EA4335"
                d="M12 4.6c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.7l3.8 2.9c1-2.9 3.6-5 6.8-5z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-ink-600">
            {isSignup ? "Already have an account?" : "New to Aarogya Voice?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
              className="font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-xs text-ink-400"
          >
            Frontend preview — no account is created and no session is stored.{" "}
            <Link href="/" className="underline-offset-4 hover:underline">
              Back to home
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  required,
  minLength,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      <input
        type={type}
        name={label.toLowerCase().replace(/\s+/g, "_")}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3.5 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
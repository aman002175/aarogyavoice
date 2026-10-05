"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/button";
import { cn } from "@/lib/config";

type Mode = "signin" | "signup";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/dashboard";
  const [mode, setMode] = useState<Mode>(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [role, setRole] = useState<"doctor" | "admin">("doctor");
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

          {/* Role selector */}
          <div className="mt-7 grid grid-cols-2 gap-2 rounded-lg bg-ink-900/5 p-1">
            {(
              [
                { id: "doctor" as const, label: "Doctor / Clinic", icon: Stethoscope },
                { id: "admin" as const, label: "Super Admin", icon: Building2 },
              ]
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRole(option.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  role === option.id
                    ? "bg-white text-ink-900 shadow-[0_1px_3px_rgb(10_14_13/0.1)]"
                    : "text-ink-600 hover:text-ink-900",
                )}
              >
                <option.icon className="size-4" />
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Doctor name" placeholder="Dr. Ananya Sharma" />
                <Field label="Clinic name" placeholder="Aarogya Dental Care" />
              </div>
            )}

            <Field
              label={role === "admin" ? "Admin email" : "Email"}
              type="email"
              placeholder={role === "admin" ? "admin@clinic.com" : "you@clinic.com"}
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
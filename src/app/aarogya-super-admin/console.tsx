"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, ShieldCheck, Stethoscope } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, ButtonLink } from "@/components/button";
import {
  adminLogin,
  adminLogout,
  fetchAdminClinics,
  isBackendConfigured,
  type AdminClinic,
} from "@/lib/backend";

/**
 * Hidden super-admin console. Deliberately unlinked: nothing in the app or
 * docs navigation points here, and the page is noindex. Real security comes
 * from the backend (env creds, scrypt hash, rate limiting, HttpOnly session) —
 * hiding the URL is only a first layer, not the defense itself.
 */
export default function SuperAdminConsole() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinics, setClinics] = useState<AdminClinic[] | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const login = await adminLogin(adminId, password);
    if (!login.ok) {
      setLoading(false);
      setError(login.error);
      return;
    }
    const list = await fetchAdminClinics();
    setLoading(false);
    if (!list.ok) {
      setError(list.error);
      return;
    }
    setClinics(list.data.clinics);
  }

  async function handleLogout() {
    await adminLogout();
    setClinics(null);
    setAdminId("");
    setPassword("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-clay-50">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-white/10">
            <ShieldCheck className="size-5 text-brand-200" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Console</span>
        </div>
        <ButtonLink href="/" size="sm" variant="secondary">
          Exit
        </ButtonLink>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-12 sm:px-8">
        {!isBackendConfigured && (
          <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Backend URL configured nahi hai — login ke liye NEXT_PUBLIC_BACKEND_URL
            set karo aur backend par SUPER_ADMIN_* env vars ready hone chahiye.
          </p>
        )}

        {clinics === null ? (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <h1 className="text-2xl font-semibold tracking-tight">Admin sign-in</h1>
            <p className="mt-1 text-sm text-brand-100/60">
              Credentials backend env me rehte hain. Attempts are rate-limited and audited.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-medium text-brand-100/90">Admin ID</span>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                autoComplete="username"
                required
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3.5 text-sm text-clay-50 placeholder:text-brand-100/30 focus:border-brand-300 focus:outline-none"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-brand-100/90">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={12}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3.5 text-sm text-clay-50 placeholder:text-brand-100/30 focus:border-brand-300 focus:outline-none"
              />
            </label>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-200">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
              {loading ? "Verifying…" : "Sign in"}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>
        ) : (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">Clinics</h1>
              <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>

            {clinics.length === 0 ? (
              <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-6 text-sm text-brand-100/60">
                No clinics yet. Run the seed script once a Twilio number is assigned.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {clinics.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4"
                  >
                    <div>
                      <p className="font-medium">{c.clinicName}</p>
                      <p className="text-xs text-brand-100/60">
                        {c.doctorName} · {c.twilioNumber}
                      </p>
                    </div>
                    <div className="text-right text-xs text-brand-100/70 tabular-nums">
                      <p>
                        tokens {c.currentRunningToken}/{c.lastAssignedToken}
                      </p>
                      <p>
                        {c.planStatus}
                        {c.isOnHoliday && " · on holiday"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="mt-8 text-center text-xs text-brand-100/40">
          Aarogya Voice · restricted console — all access attempts are logged
        </p>
      </main>
    </div>
  );
}

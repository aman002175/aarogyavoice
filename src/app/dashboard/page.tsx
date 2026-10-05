"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  LayoutDashboard,
  LogOut,
  MonitorUp,
  Phone,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, ButtonLink } from "@/components/button";
import { Waveform } from "@/components/waveform";
import { cn } from "@/lib/config";
import {
  clinicStats,
  demoAppointments,
  demoClinic,
  weeklyCalls,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/mock-data";
import {
  advanceQueue,
  demoClinicId,
  getQueueSocket,
  isBackendConfigured,
  type TokenAdvancedEvent,
  type TokenBookedEvent,
} from "@/lib/backend";

const statusStyles: Record<AppointmentStatus, string> = {
  WAITING: "bg-amber-50 text-amber-700 ring-amber-200",
  COMPLETED: "bg-brand-50 text-brand-700 ring-brand-200",
  CANCELLED: "bg-ink-100 text-ink-500 ring-ink-200",
};

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Queue display", href: "/queue-display", icon: MonitorUp, active: false },
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-600">{label}</span>
        <Icon className="size-4 text-brand-600" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-400">{sub}</p>
    </div>
  );
}

function CallsChart() {
  const max = Math.max(...weeklyCalls.map((d) => d.calls));

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-ink-900">Calls this week</h2>
          <p className="text-sm text-ink-400">Handled vs. appointments booked</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          <TrendingUp className="size-3.5" />
          +24% vs last week
        </span>
      </div>

      <div className="mt-8 flex h-40 items-end gap-3">
        {weeklyCalls.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end gap-1">
              <div
                className="flex-1 rounded-t bg-brand-600"
                style={{ height: `${(d.calls / max) * 100}%` }}
                title={`${d.calls} calls handled`}
              />
              <div
                className="flex-1 rounded-t bg-brand-200"
                style={{ height: `${(d.booked / max) * 100}%` }}
                title={`${d.booked} booked`}
              />
            </div>
            <span className="text-xs text-ink-400">{d.day}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-5 border-t border-ink-200 pt-4 text-xs text-ink-500">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-brand-600" /> Calls handled
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-brand-200" /> Appointments booked
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(demoAppointments);
  const [isOpen, setIsOpen] = useState(!demoClinic.isOnHoliday);

  // Live backend wiring. With NEXT_PUBLIC_BACKEND_URL set, the queue listens
  // to the voice agent's Socket.io events — server events are the single
  // source of truth. Without it, this page stays on demo data and behaves
  // exactly as before.
  useEffect(() => {
    if (!isBackendConfigured) return;
    const socket = getQueueSocket(demoClinicId);
    const onBooked = (p: TokenBookedEvent) => {
      setAppointments((prev) => [
        ...prev,
        {
          id: `apt_${p.day}_${p.tokenNumber}`,
          patientName: p.patientName,
          tokenNumber: p.tokenNumber,
          day: p.day,
          reason: "Booked by voice",
          status: "WAITING" as const,
        },
      ]);
    };
    const onAdvanced = (p: TokenAdvancedEvent) => {
      setAppointments((prev) =>
        prev.map((a) =>
          a.tokenNumber === p.servedToken && a.status === "WAITING"
            ? { ...a, status: "COMPLETED" as const }
            : a,
        ),
      );
    };
    socket.on("token:booked", onBooked);
    socket.on("token:advanced", onAdvanced);
    return () => {
      socket.off("token:booked", onBooked);
      socket.off("token:advanced", onAdvanced);
    };
  }, []);

  // The queue is the single source of truth. The "now serving" token is
  // derived from the head of the queue, so cancelling or completing a patient
  // can never leave the displayed token out of sync with the actual patient.
  const waiting = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "WAITING")
        .sort((a, b) => a.tokenNumber - b.tokenNumber),
    [appointments],
  );

  const serving = waiting[0] ?? null;

  // A cancelled booking is closed out, but it was never seen — counting it as
  // "processed" would report a full day as handled when it was not.
  const seen = useMemo(
    () => appointments.filter((a) => a.status === "COMPLETED").length,
    [appointments],
  );
  const cancelled = useMemo(
    () => appointments.filter((a) => a.status === "CANCELLED").length,
    [appointments],
  );

  // Every waiting patient is listed. The earlier slice(1, 5) silently dropped
  // anyone past the fifth position while the header still counted them, so a
  // waiting patient could be invisible on the board the doctor relies on.
  const rest = useMemo(() => waiting.slice(1), [waiting]);

  // The table must read in the order patients are actually seen.
  const byToken = useMemo(
    () => [...appointments].sort((a, b) => a.tokenNumber - b.tokenNumber),
    [appointments],
  );

  async function callNext() {
    if (!serving) return;
    if (isBackendConfigured) {
      // The server advances the queue atomically and broadcasts
      // `token:advanced`; updating locally here would race that event.
      await advanceQueue(demoClinicId);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === serving.id ? { ...a, status: "COMPLETED" as const } : a,
      ),
    );
  }

  function cancelPatient(id: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" as const } : a)),
    );
  }

  return (
    <div className="min-h-dvh bg-clay-50 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white px-5 py-6 lg:flex">
        <Logo />
        <nav className="mt-9 flex-1 space-y-1" aria-label="Dashboard">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-brand-50 text-brand-800"
                  : "text-ink-600 hover:bg-ink-900/5 hover:text-ink-900",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="rounded-xl bg-ink-900 p-4 text-clay-50">
          <p className="text-xs tracking-[0.14em] text-brand-200 uppercase">Trial</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {clinicStats.trialDaysLeft} days left
          </p>
          <ButtonLink href="/auth?mode=signup" size="sm" className="mt-3 w-full">
            Upgrade plan
          </ButtonLink>
        </div>

        <Link
          href="/auth"
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
        >
          <LogOut className="size-4" />
          Sign out
        </Link>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-40 border-b border-ink-200 bg-clay-50/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-5 md:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-semibold text-ink-900">Overview</h1>
              <p className="text-xs text-ink-400">
                {demoClinic.name} · {demoClinic.doctorName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-pressed={isOpen}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isOpen
                    ? "bg-brand-100 text-brand-800"
                    : "bg-ink-200/70 text-ink-600",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isOpen ? "bg-brand-600" : "bg-ink-400",
                  )}
                />
                {isOpen ? "Clinic open" : "Clinic closed"}
              </button>

              <ButtonLink
                href="/queue-display"
                size="sm"
                variant="secondary"
                className="hidden sm:inline-flex"
              >
                <MonitorUp className="size-4" />
                Queue screen
              </ButtonLink>

              <span
                className="grid size-9 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white"
                aria-label="Signed in as Dr. Ananya Sharma"
              >
                AS
              </span>
            </div>
          </div>
        </header>

        <main className="space-y-6 px-5 py-6 md:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Calls today"
              value={String(clinicStats.callsToday)}
              sub="All answered"
              icon={Phone}
            />
            <StatCard
              label="Booked today"
              value={String(clinicStats.appointmentsBooked)}
              sub="Booked by voice"
              icon={Check}
            />
            <StatCard
              label="Avg. wait"
              value={`${clinicStats.avgWaitMins} min`}
              sub="Patient estimate"
              icon={Clock}
            />
            <StatCard
              label="Missed calls"
              value="0"
              sub="Since you went live"
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-ink-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink-900">Live queue</h2>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-400 tabular-nums">
                    {serving
                      ? `${rest.length} waiting · serving token ${serving.tokenNumber}`
                      : "Queue is clear"}
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        isBackendConfigured
                          ? "bg-brand-50 text-brand-700"
                          : "bg-ink-100 text-ink-500",
                      )}
                    >
                      {isBackendConfigured ? "Live" : "Demo data"}
                    </span>
                  </p>
                </div>
                <span                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-semibold",
                    isOpen
                      ? "bg-brand-100 text-brand-800"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  {isOpen ? "Accepting patients" : "Closed for new calls"}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-6 rounded-xl bg-ink-950 p-6 text-clay-50 sm:flex-row sm:items-center">
                <div className="shrink-0 text-center">
                  <p className="text-xs tracking-[0.25em] text-brand-200/70 uppercase">
                    Now serving
                  </p>
                  <p className="mt-2 text-7xl leading-none font-semibold tabular-nums">
                    {serving ? serving.tokenNumber : "—"}
                  </p>
                  {serving ? (
                    <p className="mt-3 text-sm text-brand-50/70">
                      {serving.patientName}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-brand-50/70">Queue is clear</p>
                  )}
                </div>

                <div className="flex-1">
                  <div className="h-12">
                    <Waveform bars={34} />
                  </div>
                  <Button
                    onClick={() => void callNext()}
                    disabled={!serving || !isOpen}
                    size="lg"
                    className="mt-5 w-full sm:w-auto"
                  >
                    Next patient
                    <ArrowRight className="size-4" />
                  </Button>
                  {!isOpen && (
                    <p className="mt-2 text-xs text-brand-200/70">
                      Reopen the clinic to serve the queue.
                    </p>
                  )}
                </div>
              </div>

              <ul className="mt-5 divide-y divide-ink-200 border-y border-ink-200">
                {rest.length === 0 && (
                  <li className="py-8 text-center text-sm text-ink-400">
                    {serving
                      ? "Queue is clear. New voice bookings will appear here live."
                      : "No one is waiting."}
                  </li>
                )}
                {rest.map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-md bg-brand-50 text-sm font-semibold text-brand-800 tabular-nums">
                        {appt.tokenNumber}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-ink-900">
                          {appt.patientName}
                        </span>
                        <span className="block text-xs text-ink-400">
                          {appt.day === "tomorrow" ? "Tomorrow" : "Today"} ·{" "}
                          {appt.reason}
                        </span>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelPatient(appt.id)}
                      className="grid size-8 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                      aria-label={`Cancel ${appt.patientName}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <CallsChart />
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
              <h2 className="font-semibold text-ink-900">Today&apos;s appointments</h2>
              <span className="text-sm text-ink-400 tabular-nums">
                {seen} of {appointments.length} seen
                {cancelled > 0 && ` · ${cancelled} cancelled`}
              </span>
            </div>

            {/* Mobile: cards. A scrolling table clips the Status column on a
                phone, and status is the one field the doctor must always see. */}
            <ul className="divide-y divide-ink-200 md:hidden">
              {byToken.map((appt) => (
                <li key={appt.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-50 text-sm font-semibold text-brand-800 tabular-nums">
                      {appt.tokenNumber}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink-900">
                        {appt.patientName}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {appt.day === "tomorrow" ? "Tomorrow" : "Today"} ·{" "}
                        {appt.reason}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        statusStyles[appt.status],
                      )}
                    >
                      {appt.status.charAt(0) + appt.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-xs tracking-wide text-ink-400 uppercase">
                    <th className="px-6 py-3 font-medium">Token</th>
                    <th className="px-6 py-3 font-medium">Patient</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                    <th className="px-6 py-3 font-medium">Day</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {byToken.map((appt) => (
                    <tr key={appt.id} className="transition-colors hover:bg-clay-50">
                      <td className="px-6 py-3.5 font-semibold text-ink-900 tabular-nums">
                        {appt.tokenNumber}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-ink-900">
                        {appt.patientName}
                      </td>
                      <td className="px-6 py-3.5 text-ink-600">{appt.reason}</td>
                      <td className="px-6 py-3.5 text-ink-600">
                        {appt.day === "tomorrow" ? "Tomorrow" : "Today"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            statusStyles[appt.status],
                          )}
                        >
                          {appt.status.charAt(0) +
                            appt.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs text-ink-400">
            <Settings className="size-3.5" />
            Settings and appointment history arrive in the next release.
          </p>
        </main>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { Waveform } from "@/components/waveform";
import {
  demoClinic,
  queueBoard,
  servingToken,
  waitingQueue,
} from "@/lib/mock-data";

/**
 * Patient-facing waiting-room screen. Renders token numbers and wait times
 * only — no patient names, phone numbers, or reasons. Identity lives only in
 * the doctor dashboard, behind a session we have not implemented yet.
 */
export default function QueueDisplayPage() {
  const token = servingToken;

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-clay-50">
      <header className="flex items-center justify-between gap-4 px-6 py-5 md:px-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {demoClinic.name}
          </h1>
          <p className="text-sm text-brand-100/60">
            {demoClinic.doctorName} · {demoClinic.speciality}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-sm text-brand-100/70 sm:flex">
            <Clock className="size-4" />
            {demoClinic.openTime} – {demoClinic.closeTime}
          </span>
          <ButtonLink href="/dashboard" size="sm" variant="secondary">
            <ArrowLeft className="size-4" />
            Dashboard
          </ButtonLink>
        </div>
      </header>

      <main className="grid flex-1 gap-6 px-6 pb-8 md:px-10 lg:grid-cols-[1.15fr_1fr]">
        <section className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-12 text-center">
          <p className="text-sm tracking-[0.2em] text-brand-200/70 uppercase">
            Now serving
          </p>
          <p className="mt-3 text-8xl leading-none font-semibold tabular-nums text-brand-300 md:text-9xl">
            {token}
          </p>
          <div className="mt-8 h-10 w-56">
            <Waveform bars={26} />
          </div>
          <p className="mt-6 text-lg text-brand-50/70">
            Please stay seated — you&apos;ll be called shortly.
          </p>
        </section>

        <section className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-lg font-semibold tracking-tight">Up next</h2>
          <ul className="mt-6 flex-1 space-y-3">
            {queueBoard.map((row) => (
              <li
                key={row.token}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4"
              >
                <span className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-md bg-brand-400/15 text-lg font-semibold tabular-nums text-brand-200">
                    {row.token}
                  </span>
                  <span className="text-brand-100/70">In queue</span>
                </span>
                <span className="text-sm text-brand-100/60 tabular-nums">
                  {row.wait}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-white/10 pt-4 text-sm text-brand-100/50">
            {demoClinic.slotDuration} minutes per patient ·{" "}
            {Math.max(waitingQueue.length - 1, 0)} waiting
          </div>
        </section>
      </main>

      <p className="px-6 pb-5 text-center text-xs text-brand-100/35 md:px-10">
        This screen shows token numbers only. Patient details are never displayed
        in the waiting room.
      </p>
    </div>
  );
}
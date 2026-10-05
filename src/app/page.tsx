"use client";

import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Globe,
  Headset,
  Mic,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink, buttonClass } from "@/components/button";
import { Reveal } from "@/components/motion-primitives";
import { Waveform } from "@/components/waveform";
import {
  appConfig,
  cn,
  faqs,
  features,
  hero,
  howItWorks,
  pricingPlans,
} from "@/lib/config";
import { capabilities, demoClinic, queueBoard, servingToken } from "@/lib/mock-data";

const featureIcons: Record<string, LucideIcon> = {
  clock: Clock,
  globe: Globe,
  mic: Mic,
  calendar: CalendarCheck,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

/** Illustrative conversation. Not a recording of a real call. */
function CallTranscript() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-ink-200 bg-white p-5 shadow-[0_1px_2px_rgb(10_14_13/0.04),0_12px_32px_-24px_rgb(10_14_13/0.18)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">
          Illustrative call
        </span>
        <span className="text-xs text-ink-400 tabular-nums">00:14</span>
      </div>

      <div className="mt-4 h-12">
        <Waveform bars={32} />
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-end">            <p className="max-w-[80%] rounded-lg rounded-br-sm bg-ink-900 px-3.5 py-2.5 text-clay-50">
            Hi, kya aaj slot hai?
          </p>
        </div>
        <div className="flex">
          <p className="max-w-[88%] rounded-lg rounded-bl-sm bg-clay-100 px-3.5 py-2.5 text-ink-800">
            Aaj token 7 chal raha hai, aapka token 9 hoga — lagbhag 12 minute
            wait.
            <span className="mt-1 block font-medium text-brand-700">
              11:00 AM slot confirm kar doon?
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-3.5 py-2.5">
        <span className="text-xs font-medium text-brand-800">Booked</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-700 tabular-nums">
          <Check className="size-3.5" /> Token 9
        </span>
      </div>
    </div>
  );
}

/** Live preview of the queue board the doctor sees in the dashboard. */
function QueuePreview() {
  const nowServing = servingToken;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="font-medium text-ink-900">{demoClinic.name}</p>
        <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
          Open now
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="grid place-items-center rounded-lg bg-brand-700 px-7 py-6 text-center text-white">
          <span className="text-xs tracking-[0.2em] uppercase opacity-70">
            Now serving
          </span>
          <span className="mt-1 text-6xl font-semibold tabular-nums">
            {nowServing}
          </span>
        </div>

        <ul className="space-y-2">
          {queueBoard.map((row) => (
            <li
              key={row.token}
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-2.5"
            >
              <span className="flex items-center gap-3">                    <span className="grid size-8 place-items-center rounded-md bg-ink-900 text-sm font-semibold text-clay-50 tabular-nums">
                  {row.token}
                </span>
                <span className="text-sm font-medium text-ink-800">
                  Patient
                </span>
              </span>
              <span className="text-xs text-ink-500 tabular-nums">{row.wait}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-ink-400">
        Token numbers only — patient identities stay in the doctor dashboard.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main id="main">
        {/* ---------------- HERO ---------------- */}
        <section className="relative overflow-hidden border-b border-ink-200 pt-32 pb-20 md:pt-40">
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
            <div>
              <p className="eyebrow">{hero.eyebrow}</p>

              <h1 className="mt-6 text-balance text-5xl leading-[1.08] font-semibold tracking-tight text-ink-900 md:text-6xl">
                Your clinic&apos;s receptionist,{" "}
                <span className="text-brand-700">on duty 24/7</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
                {hero.body}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth?mode=signup" size="lg" className="group">
                  {hero.primaryCta}
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink
                  href="/dashboard"
                  size="lg"
                  variant="secondary"
                  className="group"
                >
                  {hero.secondaryCta}
                  <ArrowRight className="size-4" />
                </ButtonLink>
              </div>

              <p className="mt-4 text-sm text-ink-400">{hero.reassurance}</p>
            </div>

            <CallTranscript />
          </div>
        </section>

        {/* ---------------- CAPABILITIES ---------------- */}
        <section className="border-y border-ink-200 bg-white py-12">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((c) => (
                <div key={c.label} className="border-t-2 border-ink-900 pt-3">
                  <p className="text-3xl font-semibold tracking-tight text-ink-900">
                    {c.value}
                  </p>
                  <p className="mt-1.5 text-sm text-ink-500">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section id="how" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-ink-900">
                Three steps. No calendar, no training, no extra staff.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {howItWorks.map((step, i) => (
                <div
                  key={step.n}
                  className="h-full rounded-xl border border-ink-200 bg-white p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      {i === 0 ? (
                        <PhoneCall className="size-5" />
                      ) : i === 1 ? (
                        <Headset className="size-5" />
                      ) : (
                        <CalendarCheck className="size-5" />
                      )}
                    </span>
                    <span className="font-mono text-sm text-ink-300">{step.n}</span>
                  </div>
                  <h3 className="mt-6 font-semibold text-ink-900">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{step.body}</p>
                </div>
              ))}
            </div>

            <Reveal delay={0.1} className="mt-12">
              <QueuePreview />
            </Reveal>
          </div>
        </section>

        {/* ---------------- FEATURES ---------------- */}
        <section
          id="features"
          className="scroll-mt-20 border-y border-ink-200 bg-white py-24"
        >
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-10 md:grid-cols-2 md:items-end">
              <Reveal>
                <p className="eyebrow">Built for reception reality</p>
                <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-ink-900">
                  What a clinic front desk actually does — handled.
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-lg leading-relaxed text-ink-600">
                  Most clinics don&apos;t need a scheduling platform. They need
                  their phone answered. That is the entire job, and that is
                  exactly what this does.
                </p>
              </Reveal>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = featureIcons[f.icon];
                return (
                  <div key={f.title} className="h-full bg-white p-7">
                    <Icon className="size-5 text-brand-600" />
                    <h3 className="mt-5 font-semibold text-ink-900">{f.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-600">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- PRICING ---------------- */}
        <section
          id="pricing"
          className="scroll-mt-20 border-y border-ink-200 bg-white py-24"
        >
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Pricing</p>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-ink-900">
                Priced below one lost appointment.
              </h2>
              <p className="mt-4 text-ink-600">
                Every plan includes your own phone number and the full dashboard.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex h-full flex-col rounded-xl border p-7",
                    plan.featured
                      ? "border-brand-700 bg-ink-950 text-clay-50"
                      : "border-ink-200 bg-white text-ink-900",
                  )}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-7 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}

                  <h3 className="font-semibold">{plan.name}</h3>
                  <p
                    className={cn(
                      "mt-1.5 text-sm",
                      plan.featured ? "text-brand-100/70" : "text-ink-600",
                    )}
                  >
                    {plan.description}
                  </p>

                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight">
                      {plan.price}
                    </span>
                    {plan.cadence && (
                      <span
                        className={cn(
                          "text-sm",
                          plan.featured ? "text-brand-100/70" : "text-ink-400",
                        )}
                      >
                        {plan.cadence}
                      </span>
                    )}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      plan.featured ? "text-brand-200" : "text-brand-700",
                    )}
                  >
                    {plan.minutes}
                  </p>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            plan.featured ? "text-brand-300" : "text-brand-600",
                          )}
                        />
                        <span
                          className={
                            plan.featured ? "text-clay-100/90" : "text-ink-700"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href="/auth?mode=signup"
                    size="md"
                    className={cn(
                      "mt-8 w-full",
                      plan.featured && "bg-white text-ink-950 hover:bg-clay-100",
                    )}
                  >
                    {plan.cta}
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-3xl px-5">
            <Reveal>
              <p className="eyebrow">Questions</p>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-ink-900">
                What clinics ask us first
              </h2>
            </Reveal>

            <div className="mt-10 divide-y divide-ink-200 border-y border-ink-200">
              {faqs.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-ink-900 marker:hidden">
                    {faq.q}
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-200 text-ink-500 transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 pr-10 leading-relaxed text-ink-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="px-5 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-xl bg-ink-950 px-6 py-16 text-center md:px-16">
            <div className="relative">
              <h2 className="text-balance text-4xl font-semibold tracking-tight text-clay-50">
                Stop losing calls while you&apos;re with a patient.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-brand-100/80">
                Set up Aarogya Voice this week and hear your first handled call
                within 24 hours.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink
                  href="/auth?mode=signup"
                  size="lg"
                  className="bg-white text-ink-950 hover:bg-clay-100"
                >
                  Start free trial
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <a
                  href={`mailto:${appConfig.supportEmail}`}
                  className={buttonClass("secondary", "lg")}
                >
                  Talk to sales
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
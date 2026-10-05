import Link from "next/link";
import { appConfig } from "@/lib/config";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "For clinics",
    links: [
      { label: "Dentists", href: "#features" },
      { label: "Physiotherapists", href: "#features" },
      { label: "Dermatologists", href: "#features" },
      { label: "Multi-location groups", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign in", href: "/auth" },
      { label: "Get started", href: "/auth?mode=signup" },
      { label: "Queue display", href: "/dashboard" },
      { label: appConfig.supportEmail, href: `mailto:${appConfig.supportEmail}` },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
              Voice-based reception for clinics: every call answered, the queue
              kept current, and bookings confirmed by voice.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold tracking-[0.14em] text-ink-400 uppercase">
                {col.title}
              </h3>                <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-200 pt-6 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aarogya Voice. All rights reserved.</p>
          <p>Built for Indian clinics.</p>
        </div>
      </div>
    </footer>
  );
}
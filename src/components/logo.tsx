import Link from "next/link";
import { cn, appConfig } from "@/lib/config";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${appConfig.name} home`}
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-brand-700 text-white">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12a8 8 0 0 1 16 0" />
          <path d="M4 12v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2" />
          <path d="M20 12v3a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2" />
          <path d="M12 4v8" />
        </svg>
      </span>
      <span className="text-[1.0625rem] font-semibold tracking-tight text-ink-900">
        Aarogya
        <span className="font-normal text-brand-700"> Voice</span>
      </span>
    </Link>
  );
}
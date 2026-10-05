import Link from "next/link";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="eyebrow mt-12">Error 404</p>
      <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-ink-900">
        This page isn&apos;t on the schedule.
      </h1>
      <p className="mt-4 max-w-md text-ink-600">
        The link may be out of date. Head back to the homepage, or sign in to
        reach your clinic dashboard.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/auth" size="lg">
          Sign in
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
      <Link
        href="/#features"
        className="mt-8 text-sm text-ink-400 underline-offset-4 hover:text-brand-700 hover:underline"
      >
        Browse features and pricing
      </Link>
    </div>
  );
}

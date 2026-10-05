"use client";

/**
 * Static voice-activity readout. A real product would plot live call audio;
 * this is a fixed, non-animated stand-in so the surfaces stay calm.
 */
import { cn } from "@/lib/config";

export function Waveform({
  bars = 28,
  className,
}: {
  bars?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-full items-end gap-1", className)}
      role="img"
      aria-label="Illustrative voice activity"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 flex-1 rounded-sm bg-brand-400/45"
          style={{ height: `${28 + ((i * 37) % 72)}%` }}
        />
      ))}
    </div>
  );
}
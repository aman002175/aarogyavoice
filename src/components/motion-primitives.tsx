"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/config";

/**
 * Section-level fade-and-rise. Deliberately restrained: animating every card
 * individually reads as generated template motion. Apply this to a section
 * heading or a group, not to each child.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

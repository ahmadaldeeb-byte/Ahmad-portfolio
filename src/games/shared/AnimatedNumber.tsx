"use client";
import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect } from "react";
import { formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";

/** Score counter that rolls up to its new value. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const numerals = useSettings((s) => s.numerals);
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatNum(Math.round(v), numerals));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span className={className}>{text}</motion.span>;
}

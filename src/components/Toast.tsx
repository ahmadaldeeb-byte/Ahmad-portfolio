"use client";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { create } from "zustand";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  text: string;
}
const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }));
let nextId = 1;

export function toast(text: string, kind: Kind = "success") {
  const id = nextId++;
  useToasts.setState((s) => ({ items: [...s.items, { id, kind, text }] }));
  setTimeout(() => useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3500);
}

export function Toaster() {
  const items = useToasts((s) => s.items);
  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const colors = { success: "bg-hero-green", error: "bg-hero-red", info: "bg-hero-blue" };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`${colors[t.kind]} pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3 text-lg font-bold text-white shadow-xl`}
            >
              <Icon className="size-6" />
              {t.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

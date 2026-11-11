"use client";
import { create } from "zustand";

/**
 * Minimal in-memory router used by the standalone (single-file) build, which
 * runs without a server. It mirrors the subset of next/navigation the app uses.
 */
interface RouteState {
  path: string;
  search: string;
  stack: string[];
  go: (href: string, replace?: boolean) => void;
  back: () => void;
}

function split(href: string) {
  const [p, s = ""] = href.split("?");
  return { path: p || "/", search: s };
}

export const useRoute = create<RouteState>((set, get) => ({
  path: "/",
  search: "",
  stack: [],
  go: (href, replace) => {
    const cur = get().search ? `${get().path}?${get().search}` : get().path;
    const next = split(href);
    set((s) => ({ ...next, stack: replace ? s.stack : [...s.stack, cur] }));
    window.scrollTo?.(0, 0);
  },
  back: () => {
    const stack = get().stack.slice();
    const prev = stack.pop();
    if (prev) set({ ...split(prev), stack });
  },
}));

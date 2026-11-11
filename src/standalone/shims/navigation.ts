"use client";
import { useMemo } from "react";
import { useRoute } from "./router";

export function useRouter() {
  const go = useRoute((s) => s.go);
  const back = useRoute((s) => s.back);
  return useMemo(() => ({ push: (href: string) => go(href), replace: (href: string) => go(href, true), back, refresh: () => {} }), [go, back]);
}

export function usePathname() {
  return useRoute((s) => s.path);
}

export function useSearchParams() {
  const search = useRoute((s) => s.search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

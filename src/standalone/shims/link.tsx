"use client";
import type { AnchorHTMLAttributes } from "react";
import { useRoute } from "./router";

export default function Link({ href, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const go = useRoute((s) => s.go);
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        go(href);
      }}
    >
      {children}
    </a>
  );
}

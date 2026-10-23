"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  BarChart3,
  Database,
  Gamepad2,
  GraduationCap,
  Home,
  PlusCircle,
  Save,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSettings } from "@/store/settings";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/library", label: "مكتبة الألعاب", icon: Gamepad2 },
  { href: "/create", label: "إنشاء لعبة جديدة", icon: PlusCircle },
  { href: "/bank", label: "بنك الأسئلة", icon: Database },
  { href: "/my-games", label: "ألعابي المحفوظة", icon: Save },
  { href: "/grades", label: "الصفوف الدراسية", icon: GraduationCap },
  { href: "/results", label: "نتائج الألعاب", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[4], NAV[7]];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2">
      <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-hero-yellow to-hero-orange text-2xl shadow-[0_4px_0_0_rgb(0_0_0/0.15)]">
        ⭐
      </span>
      <span className="leading-tight">
        <span className="block font-display text-xl font-extrabold">عالم الأبطال</span>
        <span className="block text-sm text-white/80">تعلّم، العب، واكتشف!</span>
      </span>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const muted = useSettings((s) => s.muted);
  const set = useSettings((s) => s.set);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 overflow-y-auto bg-gradient-to-b from-hero-blue to-hero-purple p-5 text-white lg:flex">
        <Logo />
        <nav className="flex flex-col gap-1.5" aria-label="القائمة الرئيسية">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-12 items-center gap-3 rounded-2xl px-4 font-display text-lg font-bold transition",
                  active ? "text-hero-blue" : "text-white/90 hover:bg-white/10",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-white shadow-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative size-6" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => set({ muted: !muted })}
          className="mt-auto flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-white/15 px-4 font-display text-lg font-bold hover:bg-white/25"
        >
          {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
          {muted ? "الصوت مكتوم" : "الصوت يعمل"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-l from-hero-blue to-hero-purple px-4 py-3 text-white lg:hidden">
          <Logo />
          <button
            type="button"
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
            onClick={() => set({ muted: !muted })}
            className="grid size-12 cursor-pointer place-items-center rounded-2xl bg-white/15"
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-28 pt-6 md:px-8 lg:pb-10">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-hero-ink/10 bg-white/95 backdrop-blur lg:hidden"
        aria-label="التنقل السريع"
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold", active ? "text-hero-blue" : "text-hero-muted")}
            >
              <Icon className="size-6" />
              {item.label.replace("إنشاء لعبة جديدة", "إنشاء").replace("ألعابي المحفوظة", "ألعابي").replace("مكتبة الألعاب", "المكتبة")}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

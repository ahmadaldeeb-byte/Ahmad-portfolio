"use client";
import { Suspense, type ComponentType } from "react";
import { Providers } from "@/components/Providers";
import { Shell } from "@/components/Shell";
import { Loading } from "@/components/ui";
import BankPage from "@/app/(dash)/bank/page";
import CreatePage from "@/app/(dash)/create/page";
import GradesPage from "@/app/(dash)/grades/page";
import LibraryPage from "@/app/(dash)/library/page";
import MyGamesPage from "@/app/(dash)/my-games/page";
import HomePage from "@/app/(dash)/page";
import ResultsPage from "@/app/(dash)/results/page";
import SettingsPage from "@/app/(dash)/settings/page";
import PlayPage from "@/app/play/page";
import CurriculumPage from "@/app/(dash)/curriculum/page";
import LessonsPage from "@/app/(dash)/lessons/page";
import LessonEditPage from "@/app/(dash)/lessons/edit/page";
import LessonNewPage from "@/app/(dash)/lessons/new/page";
import LessonRunPage from "@/app/lesson-run/page";
import { useRoute } from "./shims/router";

const DASH: Record<string, ComponentType> = {
  "/": HomePage,
  "/library": LibraryPage,
  "/create": CreatePage,
  "/bank": BankPage,
  "/my-games": MyGamesPage,
  "/grades": GradesPage,
  "/results": ResultsPage,
  "/settings": SettingsPage,
  "/curriculum": CurriculumPage,
  "/lessons": LessonsPage,
  "/lessons/new": LessonNewPage,
  "/lessons/edit": LessonEditPage,
};

export function App() {
  const path = useRoute((s) => s.path);
  const search = useRoute((s) => s.search);
  const Page = DASH[path] ?? HomePage;
  return (
    <Providers>
      <Suspense fallback={<Loading />}>
        {path === "/play" ? (
          <PlayPage key={search} />
        ) : path === "/lesson-run" ? (
          <LessonRunPage key={search} />
        ) : (
          <Shell>
            <Page key={path === "/create" || path.startsWith("/lessons") ? search : undefined} />
          </Shell>
        )}
      </Suspense>
    </Providers>
  );
}

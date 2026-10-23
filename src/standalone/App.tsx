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
        ) : (
          <Shell>
            <Page key={path === "/create" ? search : undefined} />
          </Shell>
        )}
      </Suspense>
    </Providers>
  );
}

"use client";
import { Suspense } from "react";
import { HomeView } from "@/components/HomeView";
import { Loading } from "@/components/ui";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeView />
    </Suspense>
  );
}

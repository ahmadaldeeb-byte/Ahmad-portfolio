"use client";
import { Suspense } from "react";
import { PlayScreen } from "@/games/PlayScreen";
import { Loading } from "@/components/ui";

export default function PlayPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlayScreen />
    </Suspense>
  );
}

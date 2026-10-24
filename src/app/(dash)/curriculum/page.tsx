"use client";
import { Suspense } from "react";
import { CurriculumView } from "@/components/CurriculumView";
import { Loading } from "@/components/ui";

export default function CurriculumPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CurriculumView />
    </Suspense>
  );
}

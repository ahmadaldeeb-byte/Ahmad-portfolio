"use client";
import { Suspense } from "react";
import { LessonSetup } from "@/components/lessons/LessonSetup";
import { Loading } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LessonSetup />
    </Suspense>
  );
}

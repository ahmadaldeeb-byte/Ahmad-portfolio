"use client";
import { Suspense } from "react";
import { LessonsList } from "@/components/lessons/LessonsList";
import { Loading } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LessonsList />
    </Suspense>
  );
}

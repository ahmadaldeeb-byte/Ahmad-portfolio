"use client";
import { Suspense } from "react";
import { LessonEditor } from "@/components/lessons/LessonEditor";
import { Loading } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LessonEditor />
    </Suspense>
  );
}

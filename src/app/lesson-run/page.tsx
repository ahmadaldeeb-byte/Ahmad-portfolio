"use client";
import { Suspense } from "react";
import { LessonRunner } from "@/components/lessons/LessonRunner";
import { Loading } from "@/components/ui";

export default function LessonRunPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LessonRunner />
    </Suspense>
  );
}

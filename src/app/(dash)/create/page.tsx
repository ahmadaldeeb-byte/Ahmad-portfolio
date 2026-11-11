"use client";
import { Suspense } from "react";
import { CreateWizard } from "@/components/CreateWizard";
import { Loading } from "@/components/ui";

export default function CreatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateWizard />
    </Suspense>
  );
}

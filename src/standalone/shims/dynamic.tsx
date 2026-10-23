"use client";
import { lazy, Suspense, type ComponentType } from "react";

type Loader<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

export default function dynamic<P extends object>(loader: Loader<P>, opts: { loading?: () => React.ReactNode; ssr?: boolean } = {}) {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return "default" in mod ? (mod as { default: ComponentType<P> }) : { default: mod as ComponentType<P> };
  });
  const Loading = opts.loading;
  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

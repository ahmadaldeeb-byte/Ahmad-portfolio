"use client";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost" | "yellow";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-hero-blue text-white",
  secondary: "bg-white text-hero-ink border-2 border-hero-ink/10",
  success: "bg-hero-green text-white",
  danger: "bg-hero-red text-white",
  ghost: "bg-transparent text-hero-ink hover:bg-hero-ink/5 !shadow-none",
  yellow: "bg-hero-yellow text-hero-ink",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  onClick,
  silent,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" | "xl"; icon?: ReactNode; silent?: boolean }) {
  const sizes = {
    sm: "min-h-11 px-4 text-base rounded-xl gap-2",
    md: "min-h-12 px-5 text-lg rounded-2xl gap-2",
    lg: "min-h-14 px-7 text-xl rounded-2xl gap-3",
    xl: "min-h-20 px-10 text-3xl rounded-3xl gap-4",
  };
  return (
    <button
      type="button"
      className={cn(
        "btn-3d inline-flex items-center justify-center font-display font-bold select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        VARIANTS[variant],
        sizes[size],
        className,
      )}
      onClick={(e) => {
        if (!silent) sound.play("click");
        onClick?.(e);
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-hero-ink shadow-soft transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40",
        className,
      )}
      {...rest}
      onClick={(e) => {
        sound.play("click");
        rest.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-3xl bg-white p-5 shadow-soft", className)}>{children}</div>;
}

export function Badge({ children, color = "#4361EE", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold", className)}
      style={{ background: `${color}1f`, color }}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-lg text-hero-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Loading({ label = "جارٍ التحميل..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-hero-muted" role="status">
      <Loader2 className="size-10 animate-spin text-hero-blue" />
      <p className="text-lg">{label}</p>
    </div>
  );
}

export function EmptyState({ title, hint, action, art }: { title: string; hint?: string; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-hero-ink/15 bg-white/60 px-6 py-14 text-center">
      {art}
      <h3 className="text-2xl font-bold">{title}</h3>
      {hint && <p className="max-w-md text-lg text-hero-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-hero-ink/40 p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn("max-h-[90dvh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold">{title}</h2>
              <IconButton label="إغلاق" onClick={onClose} className="shadow-none bg-hero-ink/5">
                <X />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-lg text-hero-muted">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          إلغاء
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/** Labelled form field. Use `group` when the child is a set of buttons rather than one input. */
export function Field({ label, children, hint, group }: { label: string; children: ReactNode; hint?: string; group?: boolean }) {
  const content = (
    <>
      <span className="font-display text-base font-bold">{label}</span>
      {children}
      {hint && <span className="text-sm text-hero-muted">{hint}</span>}
    </>
  );
  return group ? (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      {content}
    </div>
  ) : (
    <label className="flex flex-col gap-1.5">{content}</label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-2xl border-2 border-hero-ink/10 bg-white px-4 text-lg outline-none transition focus:border-hero-blue";

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap gap-1 rounded-2xl bg-hero-ink/5 p-1", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => {
            sound.play("click");
            onChange(o.value);
          }}
          className={cn(
            "min-h-11 cursor-pointer rounded-xl px-4 font-display font-bold transition",
            o.value === value ? "bg-white text-hero-blue shadow" : "text-hero-muted hover:text-hero-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

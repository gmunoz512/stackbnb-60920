import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Page frame for host/vendor dashboards: real desktop width, room for the fixed bottom nav. */
export function DashboardFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="horizon-line" />
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">{children}</div>
    </div>
  );
}

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/10 pb-7 pt-8 sm:flex-row sm:items-end sm:justify-between lg:pt-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-foreground lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">{actions}</div>}
    </header>
  );
}

/** Section with a plain text heading and an optional link on the right. */
export function DashboardSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-10", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg text-foreground lg:text-xl">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm font-medium text-primary hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** A row in a key-figures list: label left, value right. No icons. */
export function FigureRow({ label, value, to, hint }: { label: string; value: ReactNode; to?: string; hint?: string }) {
  const body = (
    <>
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="text-right font-display text-xl tabular-nums text-foreground">{value}</div>
    </>
  );
  const cls = "flex items-center justify-between gap-4 py-4";
  return to ? (
    <Link to={to} className={cn(cls, "-mx-3 rounded-lg px-3 transition-colors hover:bg-white/5")}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function FigureList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-white/10 border-y border-white/10">{children}</div>;
}

/** Inline notice strip (payments, verification). */
export function Notice({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}

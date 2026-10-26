import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Desktop layout for host/vendor subpages: back link, display header, then a
 * main column and a sticky context column. Stacks on phones.
 */
export function SubpageShell({
  backLabel,
  onBack,
  eyebrow,
  title,
  subtitle,
  actions,
  aside,
  children,
}: {
  backLabel: string;
  onBack: () => void;
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="horizon-line" />
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:mt-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground lg:text-5xl">{title}</h1>
            {subtitle && <p className="mt-3 max-w-2xl text-sm text-muted-foreground lg:text-base">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-nowrap items-center gap-2">{actions}</div>}
        </header>
        <div className={aside ? "grid gap-x-14 gap-y-10 pt-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" : "pt-2"}>
          <div className="min-w-0">{children}</div>
          {aside && <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start lg:pt-8">{aside}</aside>}
        </div>
      </div>
    </div>
  );
}

/** A settings row: label and explanation on the left, controls on the right (stacked on phones). */
export function FormSection({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-white/10 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10">
      <div>
        <h2 className="font-display text-lg text-foreground">{title}</h2>
        {description && <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

/** Plain titled block for the context column. */
export function AsideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0 [&+&]:mt-8">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

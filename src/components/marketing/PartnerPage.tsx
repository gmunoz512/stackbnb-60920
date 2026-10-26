import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import stackdLogo from "@/assets/stackd-logo-new.png";

export interface PartnerRow {
  title: string;
  body: string;
  photo: string;
  alt: string;
}

export interface PartnerPageProps {
  audience: string;
  title: string;
  lede: string;
  heroPhoto: string;
  heroAlt: string;
  cta: { label: string; to: string };
  rows: PartnerRow[];
  steps: { title: string; body: string }[];
  closing: { title: string; body: string };
}

/** Photo-led landing page shared by /for-hosts and /for-vendors. */
export function PartnerPage(p: PartnerPageProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 lg:px-12">
        <button
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="rounded-full bg-background/40 p-2 text-foreground backdrop-blur hover:bg-background/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src={stackdLogo} alt="" className="h-8 w-8" />
          <span className="font-display text-xl">stackd</span>
        </Link>
        <Link to={p.cta.to} className="hidden text-sm font-semibold underline-offset-4 hover:underline sm:block">
          {p.cta.label}
        </Link>
      </header>

      <section className="relative isolate flex min-h-[86vh] items-end overflow-hidden">
        <img src={p.heroPhoto} alt={p.heroAlt} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="caustics absolute inset-0 -z-10" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-transparent" aria-hidden />
        <div className="w-full px-5 pb-14 lg:px-12 lg:pb-20">
          <p className="mb-4 text-base font-semibold text-secondary">{p.audience}</p>
          <h1 className="font-display max-w-[14ch] text-5xl leading-[0.95] sm:text-6xl lg:text-8xl">{p.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/80">{p.lede}</p>
          <Link
            to={p.cta.to}
            className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-brand-strong"
          >
            {p.cta.label}
          </Link>
        </div>
      </section>
      <div className="horizon-line" aria-hidden />

      <section className="mx-auto max-w-[1240px] px-5 py-20 lg:px-12 lg:py-28">
        <div className="space-y-20 lg:space-y-28">
          {p.rows.map((row, i) => (
            <article
              key={row.title}
              className={`grid items-center gap-8 lg:grid-cols-12 lg:gap-14 ${i % 2 ? "lg:[&>figure]:order-2" : ""}`}
            >
              <figure className={`overflow-hidden rounded-[28px] ${i % 2 ? "lg:col-span-6" : "lg:col-span-7"}`}>
                <img src={row.photo} alt={row.alt} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
              </figure>
              <div className={i % 2 ? "lg:col-span-6" : "lg:col-span-5"}>
                <h2 className="font-display text-3xl leading-tight lg:text-5xl">{row.title}</h2>
                <p className="mt-4 max-w-md text-lg text-muted-foreground">{row.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-12">
          <h2 className="font-display text-3xl lg:text-5xl">How it works</h2>
          <ol className="divide-y divide-border">
            {p.steps.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-4 py-6 first:pt-0">
                <span className="font-display text-2xl text-primary">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-12">
        <h2 className="font-display max-w-[18ch] text-4xl leading-tight lg:text-6xl">{p.closing.title}</h2>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{p.closing.body}</p>
        <Link
          to={p.cta.to}
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-brand-strong"
        >
          {p.cta.label}
        </Link>
      </section>
    </div>
  );
}

export default PartnerPage;

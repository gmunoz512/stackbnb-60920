import { Link } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";

/** Left-hand panel on desktop sign-in/sign-up pages; hidden on phones. */
export function AuthSidePanel() {
  return (
    <aside className="relative isolate hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/10 p-12 lg:flex">
      <div className="caustics absolute inset-0 -z-10" aria-hidden />
      <Link to="/" className="relative z-10 flex items-center gap-2">
        <img src={stackdLogo} alt="" className="h-8 w-8" />
        <span className="font-display text-xl text-foreground">stackd</span>
      </Link>
      <div className="relative z-10 max-w-md">
        <h2 className="font-display text-5xl leading-[1.05] text-foreground">Tulum, booked by people who live here.</h2>
        <p className="mt-4 text-muted-foreground">
          Hosts recommend the cenotes, boats and tables they trust. Guests book them in one place. Vendors get paid.
        </p>
        <div className="horizon-line mt-8 w-40" />
      </div>
      <p className="relative z-10 text-sm text-muted-foreground">Ratings shown on stackd come live from Google.</p>
    </aside>
  );
}

/** Small wordmark shown above the form on phones (the side panel carries it on desktop). */
export function AuthMobileMark() {
  return (
    <Link to="/" className="flex items-center gap-2 lg:hidden">
      <img src={stackdLogo} alt="" className="h-8 w-8" />
      <span className="font-display text-xl text-foreground">stackd</span>
    </Link>
  );
}

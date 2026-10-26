import { useRestaurantRating } from "@/hooks/useRestaurantRating";
import { memo, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Search, Sparkles, User } from "lucide-react";
import Logo3DSpin from "@/components/Logo3DSpin";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { useVendorRating } from "@/hooks/useVendorRating";
import heroImage from "@/assets/hero-beach.jpg";
import type { Restaurant } from "@/data/mockRestaurants";

export interface DesktopVendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  google_place_id?: string | null;
}

interface Props {
  destination: string;
  isAuthenticated: boolean;
  profileRoute: string;
  restaurants: Restaurant[];
  googlePhotos: Record<string, string>;
  experiences: DesktopVendor[];
  isLoading: boolean;
  vendorFavorites: string[];
  toggleVendorFavorite: (id: string, e: React.MouseEvent) => void;
}

const navLinks = [
  { to: "/experiences", label: "Experiences" },
  { to: "/restaurants", label: "Restaurants" },
  { to: "/trip-planner", label: "Trip planner" },
  { to: "/for-hosts", label: "For hosts" },
];

export function DesktopTopNav({ isAuthenticated, profileRoute }: { isAuthenticated: boolean; profileRoute: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1360px] items-center gap-10 px-10">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="stackd home">
          <Logo3DSpin desktopSize={34} mobileSize={34} />
          <span className="font-['Archivo_Black'] text-[22px] tracking-tight">stackd</span>
        </Link>
        <nav className="flex items-center gap-1 text-[15px]">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/wishlists" aria-label="Wishlists" className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <Heart className="h-[18px] w-[18px]" />
          </Link>
          {isAuthenticated ? (
            <Link to={profileRoute} aria-label="Profile" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-white/40">
              <User className="h-[18px] w-[18px]" />
            </Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const RestaurantTile = memo(function RestaurantTile({ r, photo }: { r: Restaurant; photo: string }) {
  const { rating } = useRestaurantRating(r);
  return (
    <Link to={`/restaurant/${r.id}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-white/5 transition-shadow group-hover:shadow-[0_18px_40px_-12px_hsl(var(--brand)/.35)] group-focus-visible:ring-2 group-focus-visible:ring-pink-500">
        <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        {r.priceRange ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">{r.priceRange}</span>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{r.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{r.cuisine}{r.neighborhood ? ` · ${r.neighborhood}` : ""}</p>
        </div>
        <div className="shrink-0 text-right text-sm">
          <GoogleRating value={rating} className="text-sm" starClassName="h-3.5 w-3.5" emptyLabel="New" />
        </div>
      </div>
    </Link>
  );
});

const ExperienceTile = memo(function ExperienceTile({ v, fav, onFav, featured = false }: { v: DesktopVendor; fav: boolean; onFav: (id: string, e: React.MouseEvent) => void; featured?: boolean }) {
  const rating = useVendorRating(v);
  return (
    <Link to={`/vendor/${v.id}`} className={featured ? "group col-span-2 row-span-2 flex flex-col focus-visible:outline-none" : "group block focus-visible:outline-none"}>
      <div className={`${featured ? "flex-1 min-h-[420px]" : "aspect-[4/5]"} relative overflow-hidden rounded-2xl bg-muted ring-1 ring-white/5 transition-shadow group-hover:shadow-[0_18px_40px_-12px_hsl(var(--brand)/.4)] group-focus-visible:ring-2 group-focus-visible:ring-purple-500`}>
        {v.photos?.[0] ? (
          <img src={v.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-purple-900/60 via-pink-900/40 to-orange-900/40 text-sm text-white/70">{v.category}</div>
        )}
        <button
          type="button"
          onClick={(e) => onFav(v.id, e)}
          aria-label={fav ? `Remove ${v.name} from wishlist` : `Save ${v.name}`}
          aria-pressed={fav}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur transition-transform hover:scale-110"
        >
          <Heart className={fav ? "h-[18px] w-[18px] fill-pink-500 text-pink-500" : "h-[18px] w-[18px] text-white"} />
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{v.category}</p>
      <h3 className={featured ? "mt-0.5 font-['Archivo_Black'] text-2xl leading-tight" : "mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug"}>{v.name}</h3>
      {featured && v.description ? <p className="mt-1 line-clamp-2 max-w-xl text-sm text-muted-foreground">{v.description}</p> : null}
      <div className="mt-1 flex items-center gap-2 text-sm">
        {v.price_per_person ? <span><span className="font-semibold">${v.price_per_person}</span> <span className="text-muted-foreground">per person</span></span> : null}
        {rating ? <GoogleRating value={rating} className="text-sm" starClassName="h-3.5 w-3.5" /> : <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-muted-foreground">New</span>}
      </div>
    </Link>
  );
});

function SkeletonGrid({ n, ratio }: { n: number; ratio: string }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className={`${ratio} rounded-2xl bg-white/5`} />
          <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
          <div className="mt-2 h-3 w-1/3 rounded bg-white/5" />
        </div>
      ))}
    </>
  );
}

export function DesktopExplore(p: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(p.experiences.map((e) => e.category))).slice(0, 7)], [p.experiences]);
  const shownExperiences = category === "All" ? p.experiences : p.experiences.filter((e) => e.category === category);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopTopNav isAuthenticated={p.isAuthenticated} profileRoute={p.profileRoute} />

      {/* Hero: wide photo band, headline left, search spanning */}
      <section className="mx-auto max-w-[1360px] px-10 pt-6">
        <div className="relative isolate overflow-hidden rounded-[28px] ring-1 ring-white/10">
          <img src={heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" fetchPriority="high" />
          <div className="caustics absolute inset-0 -z-10" aria-hidden />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,hsl(var(--background)/.9)_0%,hsl(var(--background)/.55)_45%,hsl(var(--background)/.05)_100%)]" />
          <div className="horizon-line absolute inset-x-0 bottom-0" aria-hidden />
          <div className="flex min-h-[440px] flex-col justify-end p-12">
            <p className="flex items-center gap-1.5 text-sm text-white/70"><MapPin className="h-4 w-4 text-primary" />{p.destination}, Quintana Roo</p>
            <h1 className="mt-3 max-w-[14ch] font-['Archivo_Black'] text-[64px] leading-[0.95] tracking-tight text-white">
              Eat, swim and wander Tulum.
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/75">
              {p.restaurants.length} restaurants and {p.experiences.length || "dozens of"} local experiences, picked by people who live here.
            </p>
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); navigate(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore"); }}
              className="mt-8 flex w-full max-w-[640px] items-center gap-2 rounded-full border border-white/15 bg-black/60 p-2 pl-6 backdrop-blur-xl focus-within:border-white/40"
            >
              <Search className="h-5 w-5 shrink-0 text-white/60" aria-hidden />
              <label htmlFor="desk-q" className="sr-only">Search Tulum</label>
              <input id="desk-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cenotes, tacos, sunrise yoga…" className="h-11 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/45 focus:outline-none" />
              <button type="submit" className="h-12 rounded-full bg-primary px-7 text-sm font-semibold text-white transition-transform hover:scale-[1.03]">
                Search
              </button>
              <Link to="/trip-planner" className="hidden xl:flex h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-white/85 hover:bg-white/10">
                <Sparkles className="h-4 w-4" /> Plan my trip
              </Link>
            </form>
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="mx-auto max-w-[1360px] px-10 pt-16" aria-labelledby="desk-rest">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 id="desk-rest" className="font-['Archivo_Black'] text-[32px] leading-none">Where to eat</h2>
            <p className="mt-2 text-muted-foreground">Ratings come straight from Google.</p>
          </div>
          <Link to="/restaurants" className="rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5">All {p.restaurants.length} restaurants</Link>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-10 xl:grid-cols-4">
          {p.restaurants.slice(0, 8).map((r) => (
            <RestaurantTile key={r.id} r={r} photo={p.googlePhotos[r.id] || r.photos[0]} />
          ))}
        </div>
      </section>

      {/* Experiences */}
      <section className="mx-auto max-w-[1360px] px-10 pt-20 pb-24" aria-labelledby="desk-exp">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 id="desk-exp" className="font-['Archivo_Black'] text-[32px] leading-none">Things to do</h2>
            <p className="mt-2 text-muted-foreground">Book directly with local guides and studios.</p>
          </div>
          <Link to="/experiences" className="shrink-0 rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5">See all experiences</Link>
        </div>
        {categories.length > 2 ? (
          <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter experiences">
            {categories.map((c) => (
              <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
                className={category === c
                  ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
                  : "rounded-full border border-white/15 px-4 py-2 text-sm text-muted-foreground hover:border-white/40 hover:text-foreground"}>
                {c}
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-x-6 gap-y-10 xl:grid-cols-4">
          {p.isLoading ? <SkeletonGrid n={8} ratio="aspect-[4/5]" /> : shownExperiences.map((v, i) => (
            <ExperienceTile key={v.id} featured={i === 0 && shownExperiences.length >= 5} v={v} fav={p.vendorFavorites.includes(v.id)} onFav={p.toggleVendorFavorite} />
          ))}
        </div>
        {!p.isLoading && shownExperiences.length === 0 ? (
          <p className="text-muted-foreground">No experiences listed in this category yet. <button className="underline" onClick={() => setCategory("All")}>Show all</button></p>
        ) : null}
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-10 py-8 text-sm text-muted-foreground">
          <span>Run tours or a kitchen in Tulum? <Link to="/for-vendors" className="text-foreground underline underline-offset-4">List with stackd</Link></span>
          <span className="flex gap-6"><Link to="/privacy" className="hover:text-foreground">Privacy</Link><Link to="/terms" className="hover:text-foreground">Terms</Link></span>
        </div>
      </footer>
    </div>
  );
}

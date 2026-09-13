import { Link } from "react-router-dom";
import { useState } from "react";
import Logo3DSpin from "@/components/Logo3DSpin";

const SplashPage = () => {
  const [shakeExplore, setShakeExplore] = useState(false);
  const [shakeSignup, setShakeSignup] = useState(false);

  const handleExploreClick = () => {
    setShakeExplore(true);
    setTimeout(() => setShakeExplore(false), 500);
  };

  const handleSignupClick = () => {
    setShakeSignup(true);
    setTimeout(() => setShakeSignup(false), 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, hsl(var(--primary) / 0.12) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, hsl(var(--secondary) / 0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[430px] flex flex-col items-center text-center">
        <Logo3DSpin
          className="mb-6"
          desktopSize={280}
          mobileSize={200}
        />

        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-3">
          stackd
        </p>
        <h1 className="text-3xl sm:text-4xl text-foreground mb-3">
          Stay. Discover. Book.
        </h1>
        <p className="text-sm text-muted-foreground max-w-[280px] mb-10 leading-relaxed">
          Restaurants and experiences from local hosts and vendors — booked in a few taps.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link
            to="/appview"
            onClick={handleExploreClick}
            className={`
              px-10 py-3.5 rounded-full font-medium text-sm uppercase tracking-widest text-center
              bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600
              text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)]
              transition-all duration-300
              hover:scale-[1.03] active:scale-95
              ${shakeExplore ? "animate-shake" : ""}
            `}
          >
            Explore
          </Link>
          <Link
            to="/select-role"
            onClick={handleSignupClick}
            className={`
              px-10 py-3.5 rounded-full font-medium text-sm uppercase tracking-widest text-center
              border border-border bg-card/60 text-foreground backdrop-blur-sm
              transition-all duration-300
              hover:bg-accent hover:scale-[1.03] active:scale-95
              ${shakeSignup ? "animate-shake" : ""}
            `}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;

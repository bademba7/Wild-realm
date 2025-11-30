import { Link, useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="text-emerald-300">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2m0 2c1.7 0 3.25.53 4.53 1.43C15.37 6.18 13.78 7 12 7S8.63 6.18 7.47 5.43A7.98 7.98 0 0 1 12 4m-7.46 6c.15-1.08.53-2.09 1.1-2.98C7.04 7.79 9.35 9 12 9s4.96-1.21 6.36-1.98c.57.89.95 1.9 1.1 2.98C17.89 10.65 15.09 11 12 11s-5.89-.35-7.46-1m0 4c1.57.65 4.37 1 7.46 1s5.89-.35 7.46-1a8.03 8.03 0 0 1-1.1 2.98C16.96 16.21 14.65 15 12 15s-4.96 1.21-6.36 1.98A8.03 8.03 0 0 1 4.54 14M12 20c-1.7 0-3.25-.53-4.53-1.43C8.63 17.82 10.22 17 12 17s3.37.82 4.53 1.57A7.98 7.98 0 0 1 12 20Z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Wild Realms</span>
          <span className="ml-2 hidden rounded bg-white/10 px-2 py-0.5 text-xs ring-1 ring-white/15 sm:inline">
            Preview
          </span>
        </div>

        {/* Right side: Data & Methods + Auth */}
        <nav className="flex items-center gap-3">
          <Link to="/methods" className="hidden md:inline rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/15 hover:bg-white/15">
            Data & Methods
          </Link>
          <Link to="/login" className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300">
            Sign up
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-6 pb-14 pt-4 md:grid-cols-2">
        {/* Copy column */}
        <section className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Model ecosystem change. <span className="block text-emerald-300">Inform real decisions.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85 md:pr-6">
            Explore biomes, inspect species, and run 12-month scenarios for pressures like habitat loss,
            climate change, harvest, invasives, or conservation actions.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
            {/* Animated rounded button */}
            <button
              id="main-cta"
              onClick={() => navigate("/biomes")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-8 py-3 font-semibold text-slate-900 shadow-lg transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              style={{ animation: "wr-pulse 2.6s ease-in-out infinite" }}
              aria-label="Continue to biome selection"
            >
              Continue <span aria-hidden>▶</span>
            </button>

            <Link
              to="/methods"
              className="rounded-full bg-white/10 px-6 py-3 font-semibold ring-1 ring-white/15 transition hover:bg-white/15"
            >
              View Data & Methods
            </Link>
          </div>

          {/* Chips */}
          <div className="mt-8 flex flex-wrap gap-2 text-xs">
            {["Data v2025.09","Reproducible Scenarios","CSV / JSON Export","Uncertainty Bands"].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{t}</span>
            ))}
          </div>
        </section>

        {/* Visual card (kept from previous) */}
        <section className="mx-auto w-full max-w-xl">
          <div className="relative rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 shadow-2xl backdrop-blur">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent blur-2xl" />
            <div className="flex flex-wrap gap-2">
              {[
                ["Aquatic","bg-cyan-500/20 ring-cyan-400/40"],
                ["Desert","bg-amber-500/20 ring-amber-400/40"],
                ["Forest","bg-emerald-500/20 ring-emerald-400/40"],
                ["Grassland","bg-lime-500/20 ring-lime-400/40"],
                ["Tundra","bg-sky-500/20 ring-sky-400/40"],
              ].map(([label, theme]) => (
                <span key={label} className={`text-xs px-2.5 py-1 rounded-full ring-1 ${theme}`}>{label}</span>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/10">
              <div className="mb-2 text-xs text-white/70">Population (12 months)</div>
              <div className="flex h-28 items-end gap-1">
                {[8,12,16,14,10,9,7,11,13,12,9,8].map((h,i) => (
                  <div key={i} className="w-3 rounded-t bg-emerald-400/75" style={{height: `${h * 6}px`}} />
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-white/70">Health</div>
                <div className="mt-1 h-2 w-full rounded bg-white/10">
                  <div className="h-2 rounded bg-emerald-400" style={{width: "72%"}} />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-white/70">Population</div>
                <div className="mt-1 font-semibold">100,000</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-white/70">Status</div>
                <div className="mt-1 font-semibold text-amber-300">Near Threatened</div>
              </div>
            </div>

            <p className="mt-3 text-xs text-white/60">Keyboard accessible • Alt-text • High-contrast</p>
          </div>
        </section>
      </main>

      {/* Footer stays at the bottom */}
      <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 text-sm text-white/75">
        <div>© {new Date().getFullYear()} Wild Realms • Built for learning & analysis</div>
        <div className="flex gap-4">
          <a className="hover:text-white" href="#privacy">Privacy</a>
          <a className="hover:text-white" href="#terms">Terms</a>
          <Link className="hover:text-white" to="/contact">Contact</Link>
        </div>
      </footer>

      {/* keyframes for background float + button pulse */}
      <style>{`
        @keyframes wr-float {
          0% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-52%, 12px) scale(1.04); }
          100% { transform: translate(-50%, 0) scale(1); }
        }
        @keyframes wr-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 24px rgba(16,185,129,0.25); }
          50% { transform: scale(1.03); box-shadow: 0 14px 32px rgba(16,185,129,0.35); }
        }
      `}</style>
    </div>
  );
}
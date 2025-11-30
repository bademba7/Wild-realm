import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function BiomeSelection() {
  const navigate = useNavigate();

  const biomes = [
    {
      id: 1,
      name: "Rainforest",
      description: "Dense tropical forests with high biodiversity",
      theme: "from-emerald-500/20 to-green-600/20 ring-emerald-400/40",
      color: "text-emerald-300",
    },
    {
      id: 2,
      name: "Savannah",
      description: "Grasslands with scattered trees and seasonal rainfall",
      theme: "from-amber-500/20 to-yellow-600/20 ring-amber-400/40",
      color: "text-amber-300",
    },
    {
      id: 3,
      name: "Tundra",
      description: "Cold, treeless regions with permafrost",
      theme: "from-sky-500/20 to-indigo-600/20 ring-sky-400/40",
      color: "text-sky-300",
    },
    {
      id: 4,
      name: "Desert",
      description: "Arid lands with extreme temperatures and sparse life",
      theme: "from-orange-500/20 to-red-600/20 ring-orange-400/40",
      color: "text-orange-300",
    },
    {
      id: 5,
      name: "Wetlands",
      description: "Marshes, swamps, and bogs teeming with life",
      theme: "from-teal-500/20 to-cyan-600/20 ring-teal-400/40",
      color: "text-teal-300",
    },
    {
      id: 7,
      name: "Temperate Forest",
      description: "Deciduous and mixed forests with distinct seasons",
      theme: "from-emerald-700/20 to-lime-600/20 ring-emerald-500/40",
      color: "text-emerald-300",
    },
    {
      id: 6,
      name: "Ocean",
      description: "Marine ecosystems from surface to deep sea",
      theme: "from-blue-500/20 to-cyan-600/20 ring-blue-400/40",
      color: "text-blue-300",
    },
  ];

  const handleBiomeSelect = (biomeName) => {
    const urlName = biomeName.toLowerCase().replace(/\s+/g, "");
    navigate(`/biome/${urlName}`);
  };

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
        </div>

        <nav className="flex items-center gap-3">
          <Link to="/" className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">
            Back
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Select a <span className="text-emerald-300">Biome</span>
          </h1>
          <p className="mt-3 text-lg text-white/85">Choose an ecosystem to explore and model</p>
        </div>

        {/* Biome Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {biomes.map((biome) => (
            <button
              key={biome.id}
              onClick={() => handleBiomeSelect(biome.name)}
              className="group relative rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10 hover:ring-white/20 transition-all hover:scale-105 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 text-left"
            >
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${biome.theme} opacity-0 group-hover:opacity-100 transition-opacity blur-xl`}
              />

              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-2xl font-bold ${biome.color}`}>{biome.name}</h3>
                  <span className={`text-sm px-2.5 py-1 rounded-full ring-1 ${biome.theme}`}>#{biome.id}</span>
                </div>

                <p className="text-white/70 text-sm mb-6 flex-1">{biome.description}</p>

                {/* Actions: Map view + Immersive 3D */}
                <div className="flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    {/* Map view always available */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBiomeSelect(biome.name);
                      }}
                      className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20 hover:bg-white/15 hover:ring-white/30 transition"
                      aria-label={`Open ${biome.name} map view`}
                    >
                      Map view
                    </button>

                    {/* Immersive 3D — enabled for Ocean and Temperate Forest */}
                    {(() => {
                      const immersiveEnabled =
                        biome.name === "Ocean" || biome.name === "Temperate Forest";
                      const immersivePath =
                        biome.name === "Ocean"
                          ? "/ocean-immersive"
                          : biome.name === "Temperate Forest"
                          ? "/temperate-immersive"
                          : null;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (immersiveEnabled && immersivePath) navigate(immersivePath);
                          }}
                          className={`rounded-full px-3 py-1 ring-1 transition ${
                            immersiveEnabled
                              ? "bg-cyan-400/20 text-cyan-200 ring-cyan-300/30 hover:bg-cyan-400/30 hover:ring-cyan-300/50"
                              : "bg-white/5 text-white/40 ring-white/10 pointer-events-none"
                          }`}
                          aria-label="Open immersive 3D view"
                          aria-disabled={!immersiveEnabled}
                          title={immersiveEnabled ? "Open immersive 3D" : "Immersive view coming soon"}
                        >
                          Immersive 3D
                        </button>
                      );
                    })()}
                  </div>
                  <span aria-hidden className="text-lg">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 text-sm text-white/75">
        <div>© {new Date().getFullYear()} Wild Realms • Built for learning & analysis</div>
        <div className="flex gap-4">
          <a className="hover:text-white" href="#privacy">
            Privacy
          </a>
          <a className="hover:text-white" href="#terms">
            Terms
          </a>
          <Link className="hover:text-white" to="/contact">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
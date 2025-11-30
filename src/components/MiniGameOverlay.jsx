// src/components/MiniGameOverlay.jsx
import React from "react";

export default function MiniGameOverlay({
  targets,          // [{ id, name, state }]
  onClose,          // () => void
  onReset,          // () => void
  complete,         // boolean
  points = 0,       // number
}) {
  const found = targets.filter(t => t.state === "found").length;
  const total = targets.length;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* top HUD */}
      <div className="pointer-events-auto mx-auto mt-3 w-full max-w-7xl px-6">
        <div className="rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-white/10 p-3 flex items-center justify-between">
          <div className="text-sm text-white/80">
            Mini-Game • Spot & Learn {typeof points !== "undefined" && `(Score: ${points})`}
          </div>
          <div className="flex gap-1">
            {targets.map(t => (
              <span key={t.id}
                className={`h-2.5 w-5 rounded-full ${t.state === 'found' ? 'bg-emerald-400' : 'bg-white/25'}`}
                title={t.name}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onReset}
              className="rounded px-3 py-1.5 text-sm ring-1 ring-white/20 hover:bg-white/10">
              Reset
            </button>
            <button onClick={onClose}
              className="rounded px-3 py-1.5 text-sm ring-1 ring-white/20 hover:bg-white/10">
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* bottom drawer checklist */}
      <div className="pointer-events-auto fixed inset-x-0 bottom-0 mx-auto mb-3 w-full max-w-7xl px-6">
        <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/80">
              Targets • {found}/{total} found — click animals to log them
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {targets.map(t => (
              <div key={t.id}
                   className={`rounded-xl p-3 ring-1 ring-white/10 ${t.state === 'found' ? 'bg-emerald-400/15' : 'bg-white/[0.04]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">{t.name}</span>
                  <span>{t.state === 'found' ? '✅' : '⭕'}</span>
                </div>
                <div className="text-xs text-white/50 mt-1">{t.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* completion modal */}
      {complete && (
        <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="w-[min(520px,92vw)] rounded-2xl bg-slate-900 ring-1 ring-white/10 p-6 text-center">
            <h3 className="text-2xl font-bold">Biome Complete! 🎉</h3>
            <p className="mt-2 text-white/80">
              You discovered all target species. Nice work, researcher!
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={onReset}
                className="rounded px-4 py-2 ring-1 ring-white/20 hover:bg-white/10">
                Replay
              </button>
              <button onClick={onClose}
                className="rounded px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500">
                Back to Explore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
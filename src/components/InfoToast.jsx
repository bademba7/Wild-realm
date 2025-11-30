// src/components/InfoToast.jsx
import React from "react";

export default function InfoToast({ open, onClose, title, status, blurb, link }) {
  if (!open) return null;

  const badge = (() => {
    const s = (status || "").toLowerCase();
    if (s.includes("endangered")) return "bg-red-500/80";
    if (s.includes("threat"))     return "bg-amber-500/80";
    return "bg-emerald-500/80";
  })();

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm pointer-events-auto">
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur ring-1 ring-white/10 p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className={`h-2.5 w-2.5 rounded-full mt-2 ${badge}`} />
          <div className="flex-1">
            <div className="text-base font-semibold">{title}</div>
            {status && <div className="text-xs text-white/60 mt-0.5">Status: {status}</div>}
            {blurb && <p className="text-sm text-white/80 mt-2">{blurb}</p>}
            {link && (
              <a
                href={link}
                target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-xs text-emerald-300 hover:underline"
              >
                Learn more ↗
              </a>
            )}
          </div>
          <button
            className="ml-1 text-white/60 hover:text-white text-sm"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
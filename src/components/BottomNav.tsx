"use client";

export type View = "home" | "empire" | "funnel" | "log" | "history";

const TABS: { id: View; label: string; glyph: string }[] = [
  { id: "home", label: "Home", glyph: "✺" },
  { id: "history", label: "History", glyph: "◐" },
  { id: "empire", label: "Empire", glyph: "◆" },
  { id: "funnel", label: "Funnel", glyph: "▲" },
  { id: "log", label: "Log", glyph: "✦" },
];

export function BottomNav({ current, onChange }: { current: View; onChange: (v: View) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((t) => {
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                active ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <span className={`text-xl leading-none ${active ? "text-amber-300" : ""}`}>{t.glyph}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

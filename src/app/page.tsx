"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StoreProvider, useStore } from "@/lib/store";
import { BottomNav, type View } from "@/components/BottomNav";
import { Dashboard } from "@/components/Dashboard";
import { Empire } from "@/components/Empire";
import { Funnel } from "@/components/Funnel";
import { Log } from "@/components/Log";

function AppShell() {
  const { ready, resetAll } = useStore();
  const [view, setView] = useState<View>("home");

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/40">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Gutmanis</div>
            <h1 className="text-xl font-semibold tracking-tight">Empire OS</h1>
          </div>
          <button
            onClick={() => {
              if (confirm("Reset everything? Wipes all local data.")) resetAll();
            }}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70"
          >
            Reset
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {view === "home" && <Dashboard />}
            {view === "empire" && <Empire />}
            {view === "funnel" && <Funnel />}
            {view === "log" && <Log />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav current={view} onChange={setView} />
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}

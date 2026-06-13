import React from 'react';
import { motion } from 'framer-motion';

export default function OperationalShell({ children, leftPanel, rightPanel, bottomPanel }) {
  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      {/* Top Header / Status Bar */}
      <header className="h-10 border-b border-white/5 flex items-center px-4 bg-surface/50 backdrop-blur-md justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/40">AFK INTELLIGENCE</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono text-primary/80 uppercase">Cognitive Link Active</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-white/20">V1.0.0-RC</span>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Repository Intelligence */}
        <aside className="w-64 border-r border-white/5 bg-surface/20 overflow-y-auto">
          {leftPanel}
        </aside>

        {/* Center: Cognitive Runtime */}
        <section className="flex-1 flex flex-col relative overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </section>

        {/* Right: Telemetry & Memory */}
        <aside className="w-80 border-l border-white/5 bg-surface/20 flex flex-col overflow-hidden">
          {rightPanel}
        </aside>
      </main>

      {/* Bottom: Audit & Security */}
      <footer className="h-48 border-t border-white/5 bg-surface/40 backdrop-blur-xl">
        {bottomPanel}
      </footer>
    </div>
  );
}

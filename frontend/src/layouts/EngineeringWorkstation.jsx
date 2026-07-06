export default function EngineeringWorkstation({ 
  leftPanel, 
  centerPanel, 
  rightPanel, 
  bottomPanel,
  headerStatus
}) {
  return (
    <div className="h-screen w-screen bg-[#050505] text-[#D0D0D0] overflow-hidden flex flex-col font-mono selection:bg-cyan-500/30">
      {/* Supreme Global Header */}
      <header className="h-11 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-cyan-500 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <span className="text-xs font-bold tracking-[0.3em] text-white/90">AFK COGNITIVE RUNTIME</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          {headerStatus}
        </div>
        <div className="flex items-center gap-6 text-[10px] text-white/30 uppercase tracking-widest">
          <span>Local Engine: v1.0.0-PROD</span>
          <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10">ROOTED</div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Surface: Repository Intelligence */}
        <aside className="w-72 border-r border-white/5 bg-[#080808]/40 flex flex-col overflow-hidden">
          {leftPanel}
        </aside>

        {/* Center Surface: Orchestration & Workflows */}
        <section className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {centerPanel}
          </div>
        </section>

        {/* Right Surface: Telemetry & Memory */}
        <aside className="w-80 border-l border-white/5 bg-[#080808]/40 flex flex-col overflow-hidden">
          {rightPanel}
        </aside>
      </main>

      {/* Bottom Surface: Immutable Audit & Risk */}
      <footer className="h-56 border-t border-white/5 bg-[#0A0A0A] flex flex-col overflow-hidden">
        {bottomPanel}
      </footer>
    </div>
  );
}

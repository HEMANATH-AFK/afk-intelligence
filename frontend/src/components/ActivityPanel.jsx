import { Activity, Cpu, Network, Zap } from 'lucide-react';

export default function ActivityPanel() {
  return (
    <div className="w-72 bg-surface/30 border-l border-white/5 backdrop-blur-md flex flex-col hidden lg:flex">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-white/80">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm uppercase tracking-wider">System Intel</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        
        {/* Model Status */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Active Model</h3>
          <div className="bg-surface2 rounded-lg p-3 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" /> Gemma:2b
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
            </div>
            <div className="flex justify-between text-xs text-white/50 font-mono">
              <span>CTX: 8k</span>
              <span>GPU: 4.2GB</span>
            </div>
          </div>
        </div>

        {/* Live Diagnostics */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Diagnostics</h3>
          <div className="bg-surface2 rounded-lg p-3 border border-white/5 space-y-2 font-mono text-xs text-white/60">
            <div className="flex justify-between">
              <span className="flex items-center gap-2"><Network className="w-3 h-3"/> Network</span>
              <span className="text-green-400">Stable</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2"><Zap className="w-3 h-3"/> Compute</span>
              <span className="text-amber-400">42%</span>
            </div>
          </div>
        </div>
        
        {/* Memory Stream Log */}
        <div className="space-y-3 flex-1 flex flex-col">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Memory Stream</h3>
          <div className="flex-1 bg-black/40 rounded-lg p-3 border border-white/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none" />
            <div className="space-y-3 font-mono text-[10px] text-white/40 opacity-70">
              <p className="text-primary">[SYS] Initialized local agent</p>
              <p>[MEM] Connected to MongoDB</p>
              <p>[SCAN] Watching workspace path</p>
              <p className="animate-pulse">_ Awaiting input...</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useGraphStore } from '../../stores/useGraphStore';
import { Share2, Zap, Target, Box } from 'lucide-react';

export default function GraphExplorer() {
  const { nodes, blastRadius, selectedNodeId, selectNode } = useGraphStore();

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Tactical Graph Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="px-3 py-1.5 bg-[#0A0A0A]/80 border border-white/10 rounded-lg backdrop-blur-md flex items-center gap-3">
          <Share2 className="w-3 h-3 text-cyan-500" />
          <span className="text-[10px] font-bold tracking-widest text-white/60">GRAPH_ENGINE: ACTIVE</span>
        </div>
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-mono text-white/30 hover:bg-white/10 cursor-pointer transition-colors">
            ARCH_VIEW
          </div>
          <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-mono text-white/30 hover:bg-white/10 cursor-pointer transition-colors">
            DEP_VIEW
          </div>
        </div>
      </div>

      {/* Visual Surface (Mock React Flow) */}
      <div className="flex-1 relative cursor-crosshair">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
        
        {/* Placeholder Nodes with Pulse Effects */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
             {/* Mocking a simple graph structure */}
             <Node x="20%" y="30%" label="auth_middleware.py" type="file" active />
             <Node x="50%" y="50%" label="Orchestrator.py" type="class" active pulse />
             <Node x="75%" y="40%" label="db_client.py" type="file" />
             <Node x="45%" y="20%" label="intent.py" type="file" />
             <Node x="55%" y="80%" label="memory.py" type="file" />
             
             {/* Simple SVG connections */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="75%" y2="40%" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
                <line x1="45%" y1="20%" x2="50%" y2="50%" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
                <line x1="55%" y1="80%" x2="50%" y2="50%" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
             </svg>
          </div>
        </div>
      </div>

      {/* Node Detail Side-Drawer (Conditional) */}
      {selectedNodeId && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          className="absolute right-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-l border-white/5 p-5 z-20 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Node Inspector</h4>
            <button onClick={() => selectNode(null)} className="text-white/20 hover:text-white/50">×</button>
          </div>
          <div className="space-y-6">
            <div>
              <div className="text-[8px] text-cyan-500/60 font-mono mb-1 uppercase">Entity ID</div>
              <div className="text-xs font-mono text-white/80">{selectedNodeId}</div>
            </div>
            <div>
              <div className="text-[8px] text-cyan-500/60 font-mono mb-1 uppercase">Cognitive Weight</div>
              <div className="text-xs font-mono text-white/80 tracking-tighter">0.84 (CORE_HUB)</div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="text-[8px] text-cyan-500/60 font-mono mb-2 uppercase">Outbound Deps</div>
              <div className="space-y-1">
                <div className="text-[9px] font-mono text-white/40">→ mongodb_client</div>
                <div className="text-[9px] font-mono text-white/40">→ ollama_service</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Node({ x, y, label, type, active, pulse }) {
  const { selectNode } = useGraphStore();
  
  return (
    <motion.div 
      style={{ left: x, top: y }}
      onClick={() => selectNode(label)}
      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {pulse && (
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-cyan-500 rounded-full"
            />
          )}
          <div className={`w-3 h-3 rounded-sm border ${
            active ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-[#0A0A0A] border-white/20'
          } group-hover:border-cyan-400 transition-colors`} />
        </div>
        <div className="px-2 py-0.5 bg-[#0A0A0A]/80 border border-white/5 rounded text-[8px] font-mono text-white/40 whitespace-nowrap group-hover:text-white/90 group-hover:border-white/20 transition-all">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

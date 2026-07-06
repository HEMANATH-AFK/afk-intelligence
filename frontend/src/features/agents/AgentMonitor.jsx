import { motion } from 'framer-motion';
import { useOrchestrationStore } from '../../stores/useOrchestrationStore';
import { AgentRole } from '../../types/system';
import { Shield, Code, Search, Binary } from 'lucide-react';

const AGENT_CONFIG = {
  [AgentRole.ARCHITECT]: { icon: Shield, color: 'text-cyan-400', label: 'ARCHITECT' },
  [AgentRole.CODER]: { icon: Code, color: 'text-emerald-400', label: 'CODER' },
  [AgentRole.REVIEWER]: { icon: Search, color: 'text-amber-400', label: 'REVIEWER' },
  [AgentRole.TESTER]: { icon: Binary, color: 'text-purple-400', label: 'TESTER' },
  [AgentRole.ORCHESTRATOR]: { icon: Binary, color: 'text-white/40', label: 'SYSTEM' }
};

export default function AgentMonitor() {
  const { activeAgent, confidence } = useOrchestrationStore();

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
        <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Agent Collaboration</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {Object.entries(AGENT_CONFIG).filter(([role]) => role !== AgentRole.ORCHESTRATOR).map(([role, config]) => {
          const isActive = activeAgent === role;
          const Icon = config.icon;
          
          return (
            <motion.div 
              key={role}
              animate={{ 
                opacity: isActive ? 1 : 0.3,
                borderColor: isActive ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)',
                backgroundColor: isActive ? 'rgba(6,182,212,0.05)' : 'transparent'
              }}
              className="p-3 border rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-wider">{config.label}</div>
                  <div className="text-[8px] text-white/20 font-mono">
                    {isActive ? 'ACTIVE REASONING' : 'IDLE'}
                  </div>
                </div>
              </div>
              
              {isActive && (
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-mono text-cyan-400">{(confidence * 100).toFixed(0)}%</div>
                  <div className="text-[7px] text-white/30 uppercase tracking-tighter">Confidence</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

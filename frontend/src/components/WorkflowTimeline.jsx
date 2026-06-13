import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, AlertCircle, ArrowRight, Search, Bug } from 'lucide-react';

export default function WorkflowTimeline({ steps, currentStepIndex }) {
  if (!steps || steps.length === 0) return null;
  
  const isWorkflowCompleted = currentStepIndex >= steps.length;
  
  return (
    <div className="p-4 bg-surface2/50 border border-white/5 rounded-2xl mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <h3 className="text-[10px] uppercase font-mono tracking-widest text-white/40">Active Workflow Plan</h3>
      </div>
      
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          
          return (
            <div key={idx} className="flex gap-3 relative">
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className={`absolute left-2 top-5 w-0.5 h-full ${
                  isCompleted ? 'bg-primary/30' : 'bg-white/5'
                }`} />
              )}
              
              <div className="relative z-10">
                {isCompleted ? (
                  <motion.div
                    animate={{
                      boxShadow: ["0px 0px 0px rgba(16,185,129,0)", "0px 0px 15px rgba(16,185,129,0.8)", "0px 0px 0px rgba(16,185,129,0)"],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    className="rounded-full bg-surface"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin bg-surface" />
                ) : (
                  <Circle className="w-4 h-4 text-white/10 bg-surface" />
                )}
              </div>
              
              <div className={`flex-1 text-[11px] font-mono transition-colors ${
                isActive ? 'text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : isCompleted ? 'text-white/40' : 'text-white/20'
              }`}>
                {step.description}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Predictive Loop: Suggested Next Steps */}
      {isWorkflowCompleted && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-4 border-t border-white/5 space-y-3"
        >
          <div className="flex items-center gap-2 text-[9px] font-mono text-white/40 uppercase">
            <ArrowRight className="w-3 h-3" />
            <span>Suggested Next Actions</span>
          </div>
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/50 rounded-lg text-left transition-all group">
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono text-cyan-50">Analyze Auth Flow Dependency</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg text-left transition-all group">
              <Bug className="w-3.5 h-3.5 text-white/40 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono text-white/70">Run Unit Tests on Updated Modules</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

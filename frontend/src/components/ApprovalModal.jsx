import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, XCircle, Play } from 'lucide-react';

export default function ApprovalModal({ isOpen, payload, onApprove, onReject }) {
  if (!payload) return null;

  const { tool, args, explanation, risk } = payload;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className={`p-4 flex items-center gap-3 border-b border-white/5 ${
              risk.level === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'
            }`}>
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-bold font-mono text-sm tracking-tight">EXECUTION APPROVAL REQUIRED</h2>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Intent & Reasoning */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-mono tracking-widest">
                  <Play className="w-3 h-3" /> <span>Execution Plan</span>
                </div>
                <p className="text-sm font-medium text-white/80">{explanation.objective}</p>
                <p className="text-xs text-white/50 leading-relaxed italic">"{explanation.reasoning}"</p>
              </div>

              {/* Command Details */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono">
                <div className="text-[10px] text-white/30 mb-2">TARGET COMMAND</div>
                <div className="text-sm text-primary break-all">{tool}: {JSON.stringify(args)}</div>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface2 border border-white/5 rounded-lg">
                  <div className="text-[10px] text-white/30 mb-1">RISK LEVEL</div>
                  <div className={`text-xs font-bold ${
                    risk.level === 'HIGH' ? 'text-red-400' : 'text-primary'
                  }`}>{risk.level}</div>
                </div>
                <div className="p-3 bg-surface2 border border-white/5 rounded-lg">
                  <div className="text-[10px] text-white/30 mb-1">IMPACT RADIUS</div>
                  <div className="text-xs text-white/70">Project Root</div>
                </div>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-[11px] text-white/60 leading-normal">
                  <span className="text-primary font-bold">Policy Note:</span> {risk.reason} Rollback snapshots will be initialized before execution.
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface2 border-t border-white/5 flex gap-3">
              <button 
                onClick={onReject}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> REJECT
              </button>
              <button 
                onClick={onApprove}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> AUTHORIZE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { useContextStore } from '../../stores/useContextStore';
import { Brain, FileText, Share2, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EvidencePanel() {
  const { evidence, tokenBudget } = useContextStore();
  
  // Simulated hypothesis for demonstration
  const currentHypothesis = "I believe the state flow issue lies here because the authentication middleware is not properly passing the decoded JWT token to the subsequent route handlers, causing a 401 on verified requests.";
  
  return (
    <div className="p-5 flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-500" />
          <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Decision Rationale</h3>
        </div>
        <div className="text-[9px] font-mono text-white/20">
          {tokenBudget.used} / {tokenBudget.total} TOKENS
        </div>
      </div>

      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-cyan-500 transition-all duration-500"
          style={{ width: `${(tokenBudget.used / tokenBudget.total) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {/* The AI's Hypothesis */}
        <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-400">
            <Target className="w-3 h-3" />
            <span>ACTIVE_HYPOTHESIS</span>
          </div>
          <p className="text-[11px] text-white/80 leading-relaxed font-mono">
            {currentHypothesis}
          </p>
        </div>

        {/* The Evidence (Linked) */}
        {evidence.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-[10px] text-white/10 italic">
            NO CONTEXT RETRIEVED
          </div>
        ) : (
          evidence.map((chunk, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="p-3 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-colors rounded-xl space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-mono text-white/40">
                  <FileText className="w-3 h-3 group-hover:text-cyan-400 transition-colors" />
                  <span className="truncate max-w-[140px]">{chunk.source}</span>
                </div>
                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  chunk.tier === 'CRITICAL' ? 'bg-cyan-500/10 text-cyan-400' : 
                  chunk.tier === 'SUPPORTING' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/30'
                }`}>
                  {chunk.tier}
                </div>
              </div>
              <p className="text-[10px] text-white/60 leading-relaxed font-mono">
                {/* Simulated underlining of exact phrases for visual demonstration */}
                {chunk.content.split(' ').map((word, wIdx) => {
                  const isHighlighted = wIdx % 15 === 3 || wIdx % 15 === 4;
                  return (
                    <span key={wIdx} className={isHighlighted ? 'text-cyan-300 border-b border-cyan-500/50 mr-1 bg-cyan-500/10' : 'mr-1'}>
                      {word}
                    </span>
                  );
                })}
              </p>
              
              {/* Confidence Mapping Link */}
              <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[8px] text-white/20 group-hover:text-white/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-1">
                  <Share2 className="w-2.5 h-2.5" />
                  <span>VIEW GRAPH MAPPING</span>
                </div>
                <span>RELEVANCE: {(chunk.relevance * 100).toFixed(1)}%</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

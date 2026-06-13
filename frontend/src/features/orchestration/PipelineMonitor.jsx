import React from 'react';
import { motion } from 'framer-motion';
import { useOrchestrationStore } from '../../stores/useOrchestrationStore';

const STAGES = [
  'RECEIVE_GOAL',
  'PLAN_WORKFLOW',
  'EXECUTE_STEP',
  'VERIFY_RESULT',
  'STORE_MEMORY'
];

export default function PipelineMonitor() {
  const { currentStage } = useOrchestrationStore();

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((stage, i) => {
        const isActive = currentStage.includes(stage);
        const isPast = STAGES.findIndex(s => currentStage.includes(s)) > i;
        
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1">
              <motion.div 
                animate={{ 
                  backgroundColor: isActive ? (stage === 'EXECUTE_STEP' ? '#3B82F6' : '#06B6D4') : isPast ? '#06B6D444' : '#FFFFFF11',
                  scale: isActive ? 1.5 : 1,
                  boxShadow: isActive ? (stage === 'EXECUTE_STEP' ? '0px 0px 10px rgba(59,130,246,0.8)' : '0px 0px 8px rgba(6,182,212,0.5)') : 'none'
                }}
                transition={{ duration: 0.3 }}
                className="w-1.5 h-1.5 rounded-full"
              />
              <span className={`text-[8px] font-mono tracking-tighter transition-all ${
                isActive 
                  ? (stage === 'EXECUTE_STEP' 
                      ? 'text-blue-400 font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' 
                      : 'text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]') 
                  : 'text-white/20'
              }`}>
                {stage.split('_')[0]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="w-4 h-[1px] bg-white/5 mb-3" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

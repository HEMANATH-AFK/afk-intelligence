import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrchestrationStore } from '../../stores/useOrchestrationStore';
import { EventParser } from '../../core/events/parser';
import PipelineMonitor from './PipelineMonitor';
import WorkflowTimeline from '../../components/WorkflowTimeline';
import { BrainCircuit, Command, Loader2, Sparkles, TerminalSquare } from 'lucide-react';

export default function CommandHub() {
  const { messages, isStreaming, currentStage, activeWorkflow, addMessage, setStreaming, processEvent } = useOrchestrationStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStage]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input;
    setInput('');
    addMessage({ id: Date.now().toString(), role: 'user', content: userMessage, events: [] });
    setStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, model: 'gemma:2b' })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      addMessage({ id: 'reply', role: 'assistant', content: '', events: [] });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          const event = EventParser.parse(line);
          if (event) processEvent(event);
        }
      }
    } catch (error) {
      console.error('Orchestration failed:', error);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Active Pipeline Header */}
      <motion.div 
        animate={{
          boxShadow: currentStage.includes('EXECUTE') ? '0px 4px 20px -5px rgba(6,182,212,0.2)' : 'none',
          borderColor: currentStage.includes('EXECUTE') ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)'
        }}
        className="sticky top-0 bg-[#050505] z-10 pb-4 border-b flex items-center justify-between transition-colors duration-500"
      >
        <PipelineMonitor />
        {isStreaming && (
          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <Loader2 className="w-3 h-3 text-cyan-500 animate-spin" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Orchestrating...</span>
          </div>
        )}
      </motion.div>

      {/* Workflow Visualization */}
      <AnimatePresence>
        {activeWorkflow && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <WorkflowTimeline 
              steps={activeWorkflow.steps} 
              currentStepIndex={activeWorkflow.currentStepIndex} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Ledger */}
      <div className="flex-1 space-y-12">
        {messages.map((msg, i) => {
          const isError = msg.content?.includes('Error') || msg.content?.includes('FAILED');
          const isSuccess = msg.content?.includes('SUCCESS') || msg.content?.includes('Completed');
          
          return (
            <div key={i} className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] group ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center gap-3 mb-3 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">
                  {msg.role === 'user' ? 'OPERATOR_SIGNAL' : `${msg.agent || 'SYSTEM'}_REASONING`}
                  <div className={`h-[1px] flex-1 ${isError ? 'bg-red-500/50' : 'bg-white/5'}`} />
                </div>
                <motion.div 
                  initial={false}
                  animate={{
                    boxShadow: isError ? '0px 0px 15px rgba(239,68,68,0.3)' : isSuccess ? '0px 0px 15px rgba(16,185,129,0.1)' : 'none',
                    borderColor: isError ? 'rgba(239,68,68,0.5)' : isSuccess ? 'rgba(16,185,129,0.3)' : msg.role === 'user' ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)'
                  }}
                  className={`p-5 rounded-2xl border ${
                    msg.role === 'user' 
                      ? 'bg-cyan-500/5 text-cyan-50' 
                      : isError ? 'bg-red-950/20 text-red-100' : 'bg-[#0A0A0A] text-white/80'
                  } text-[13px] leading-relaxed font-mono shadow-2xl transition-colors duration-500`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </motion.div>
              </div>
            </div>
          );
        })}

        {isStreaming && currentStage.includes('THINKING') && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-center gap-3 text-cyan-500/40 text-[11px] font-mono italic px-4"
          >
            <BrainCircuit className="w-4 h-4 animate-pulse" />
            <span>{currentStage.replace('THINKING: ', '')}</span>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Operational Input Console */}
      <div className="sticky bottom-0 bg-[#050505] pt-4 pb-2">
        
        {/* Predictive Suggestions */}
        {!isStreaming && messages.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3 overflow-x-auto custom-scrollbar pb-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 mr-2 flex-shrink-0" />
            <button 
              onClick={() => setInput('Analyze Auth Flow Dependency')}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono text-white/60 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-950/30 transition-all"
            >
              🔍 Analyze Auth Flow Dependency
            </button>
            <button 
              onClick={() => setInput('Run Unit Tests')}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono text-white/60 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-950/30 transition-all"
            >
              🐛 Run Unit Tests
            </button>
            <button 
              onClick={() => setInput('Generate Component Docs')}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono text-white/60 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-950/30 transition-all"
            >
              📄 Generate Component Docs
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
            placeholder="ENTER MISSION OBJECTIVE OR COMMAND..."
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-6 py-4 text-sm font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10 group-hover:border-white/20"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-20 group-focus-within:opacity-100 transition-opacity">
            <span className="text-[10px] font-mono text-white/40">SYSTEM_READY</span>
            <button type="submit" className="p-1 hover:bg-white/5 rounded transition-colors">
              <Command className="w-4 h-4 text-cyan-500" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

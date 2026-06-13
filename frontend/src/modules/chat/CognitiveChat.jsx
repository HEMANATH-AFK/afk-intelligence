import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrchestratorStore } from '../../stores/useOrchestratorStore';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { EventParser } from '../../core/events/parser';
import { BrainCircuit, Loader2, Play, AlertCircle } from 'lucide-react';

export default function CognitiveChat() {
  const { messages, isStreaming, currentThought, addMessage, setStreaming } = useOrchestratorStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentThought]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = e.target.elements.message.value;
    if (!input) return;

    e.target.reset();
    addMessage({ id: Date.now().toString(), role: 'user', content: input, events: [] });
    setStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, model: 'gemma:2b' })
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
          if (event) EventParser.dispatch(event);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Message Stream */}
      <div className="flex-1 space-y-8">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-primary/10 border border-primary/20 text-white' 
                : 'bg-surface border border-white/5 text-white/80'
            }`}>
              <div className="text-xs font-mono text-white/30 mb-2 flex items-center gap-2">
                {msg.role === 'user' ? 'OPERATOR' : 'AFK INTELLIGENCE'}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {/* Real-time Thinking Overlay */}
        <AnimatePresence>
          {currentThought && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-primary/60 font-mono text-[11px]"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{currentThought}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={endRef} />
      </div>

      {/* Input Console */}
      <form onSubmit={handleSubmit} className="mt-auto relative">
        <input 
          name="message"
          autoComplete="off"
          placeholder="ENTER COMMAND OR OBJECTIVE..."
          className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-[10px] text-white/20 font-mono">⌘ + ENTER</span>
          <BrainCircuit className="w-4 h-4 text-white/10" />
        </div>
      </form>
    </div>
  );
}

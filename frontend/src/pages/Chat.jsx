import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BrainCircuit, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import ApprovalModal from '../components/ApprovalModal';
import WorkflowTimeline from '../components/WorkflowTimeline';

export default function Chat() {
  const { messages, isTyping, currentThought, sendMessage, pendingApproval, submitApproval, activeWorkflow } = useChatStore();
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentThought]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    setInput('');
    await sendMessage(userInput);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <AnimatePresence>
        {activeWorkflow && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <WorkflowTimeline 
              steps={activeWorkflow.steps} 
              currentStepIndex={activeWorkflow.currentStepIndex} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 pb-6">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
              msg.role === 'user' 
                ? 'bg-surface2 border border-white/10' 
                : 'bg-primary/20 border border-primary/30 text-primary'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-white/40 uppercase tracking-wider font-mono">
                {msg.role === 'user' ? 'User' : 'Agent'}
              </span>
              
              {msg.role === 'assistant' && msg.events && msg.events.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {msg.events.map((evt, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] text-primary/70 font-mono bg-primary/5 px-2 py-1 rounded border border-primary/10">
                      <Activity className="w-3 h-3" />
                      <span>{evt}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-surface/50 border border-white/5 font-mono whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}
        
        <AnimatePresence>
          {isTyping && currentThought && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-md bg-transparent flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-accent animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{currentThought}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={endRef} />
      </div>

      <ApprovalModal 
        isOpen={!!pendingApproval}
        payload={pendingApproval?.payload}
        onApprove={() => submitApproval(true)}
        onReject={() => submitApproval(false)}
      />

      <div className="mt-4 pt-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Initialize cognitive protocol or execute command..."
            className="w-full bg-surface2 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={isTyping || !input.trim()}
            className="absolute right-2 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:hover:bg-primary/10 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

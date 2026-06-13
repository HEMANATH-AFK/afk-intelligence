import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Terminal() {
  const [history, setHistory] = useState([
    { type: 'sys', text: 'AFK Intelligence Terminal [Version 1.0.0]' },
    { type: 'sys', text: '(c) AFK Corporation. All rights reserved.\n' },
    { type: 'sys', text: 'Connecting to local execution environment...' },
    { type: 'success', text: 'Connected.\n' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setHistory(prev => [...prev, { type: 'cmd', text: `> ${input}` }]);
    
    if (input.trim() === 'clear') {
      setHistory([]);
    } else {
      setHistory(prev => [...prev, { type: 'err', text: `Command execution is currently in sandbox mode. '${input}' not executed.` }]);
    }
    
    setInput('');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      <div className="flex flex-col gap-2 mb-6 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">System Terminal</h1>
        <p className="text-white/50 text-sm">Direct command line access to the local operating environment.</p>
      </div>

      <div className="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden relative">
        <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0 bg-surface3/50">
          <TerminalIcon className="w-4 h-4 text-white/40 mr-2" />
          <span className="text-xs font-mono text-white/40">tty1 - local</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {history.map((line, i) => (
            <div key={i} className={`mb-1 whitespace-pre-wrap ${
              line.type === 'err' ? 'text-red-400' :
              line.type === 'success' ? 'text-green-400' :
              line.type === 'cmd' ? 'text-white' : 'text-white/60'
            }`}>
              {line.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="h-12 border-t border-white/10 shrink-0 flex items-center px-4 bg-surface3/30">
          <span className="text-primary font-mono mr-2">&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}

import { Database, Clock, Target, Box } from 'lucide-react';

const MOCK_MEMORIES = [
  { id: 1, type: 'semantic', content: 'Project uses FastAPI with Pydantic v2. Orchestration is stateful.', relevance: 0.98, age: '2h' },
  { id: 2, type: 'episodic', content: 'User requested a total frontend rebuild. Context budget expanded to 32k.', relevance: 0.92, age: '15m' },
  { id: 3, type: 'fact', content: 'MongoDB is running on port 27017. Audit logs are immutable.', relevance: 0.85, age: '1d' },
  { id: 4, type: 'semantic', content: 'Risk engine classifies "rm -rf" as CRITICAL. Sudo is blocked.', relevance: 0.89, age: '5h' }
];

export default function MemoryExplorer() {
  return (
    <div className="p-5 flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-500" />
          <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Semantic Memory Hub</h3>
        </div>
        <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-mono text-white/20 uppercase tracking-tighter">
          Vectorized
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {MOCK_MEMORIES.map((memory) => (
          <div key={memory.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 group hover:border-cyan-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded bg-white/5 ${
                  memory.type === 'semantic' ? 'text-cyan-400' : 'text-amber-400'
                }`}>
                  {memory.type === 'semantic' ? <Box className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                </div>
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{memory.type}</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] text-white/10">
                <Clock className="w-2.5 h-2.5" />
                <span>{memory.age} AGO</span>
              </div>
            </div>
            
            <p className="text-[10px] text-white/60 leading-relaxed font-mono">
              {memory.content}
            </p>
            
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1">
                <Target className="w-2.5 h-2.5 text-cyan-500/40" />
                <span className="text-[8px] text-white/30 font-mono uppercase">RELEVANCE: {(memory.relevance * 100).toFixed(0)}%</span>
              </div>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[9px] text-white/20 font-mono">
          <span>EMBEDDINGS: text-embedding-ada-002</span>
          <span>DIMS: 1536</span>
        </div>
      </div>
    </div>
  );
}

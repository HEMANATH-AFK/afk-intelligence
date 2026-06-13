import { BrainCircuit, Database, HardDrive, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Memory() {
  const memoryBanks = [
    { title: 'Core Vector DB', status: 'Online', icon: Database, capacity: '2.4 GB', used: '45%' },
    { title: 'Conversation History', status: 'Online', icon: Share2, capacity: '500 MB', used: '12%' },
    { title: 'Workspace Context', status: 'Indexing', icon: HardDrive, capacity: '10 GB', used: '1.2 GB' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Memory Systems</h1>
        <p className="text-white/50 text-sm">Manage persistent agent memory and contextual knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {memoryBanks.map((bank, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="glass-panel p-6 rounded-xl flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-surface2 rounded-lg border border-white/5">
                <bank.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded-full border ${
                bank.status === 'Online' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                'border-yellow-500/30 text-yellow-400 bg-yellow-500/10 animate-pulse'
              }`}>
                {bank.status}
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold">{bank.title}</h3>
              <p className="text-xs text-white/50 mt-1">Capacity: {bank.capacity}</p>
            </div>
            
            <div className="mt-auto space-y-2 pt-4">
              <div className="flex justify-between text-xs text-white/60 font-mono">
                <span>Usage</span>
                <span>{bank.used}</span>
              </div>
              <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${bank.status === 'Online' ? 'bg-primary' : 'bg-yellow-500'}`} 
                  style={{ width: bank.used.includes('%') ? bank.used : '12%' }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-xl min-h-[300px] flex flex-col relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 w-64 h-64 pointer-events-none">
          <BrainCircuit className="w-full h-full" />
        </div>
        <h2 className="text-lg font-semibold mb-4 border-b border-white/5 pb-4 relative z-10">Neural Connections</h2>
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center space-y-2">
            <p className="text-white/40 font-mono text-sm">MongoDB instance required for deep visualization.</p>
            <button className="text-primary hover:underline text-sm font-medium">Configure Database URI</button>
          </div>
        </div>
      </div>
    </div>
  );
}

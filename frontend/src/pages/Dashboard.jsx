import { motion } from 'framer-motion';
import { Terminal, Code, Database, Zap } from 'lucide-react';

export default function Dashboard() {
  const cards = [
    { title: 'Local AI Running', value: 'Gemma:2b', icon: Zap, color: 'text-yellow-400' },
    { title: 'Analyzed Files', value: '1,248', icon: Code, color: 'text-primary' },
    { title: 'Memory Nodes', value: '342', icon: Database, color: 'text-accent' },
    { title: 'Active Sessions', value: '1', icon: Terminal, color: 'text-green-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-white/50 text-sm">Welcome to your local AI operating environment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/20 transition-colors"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <card.icon className={`w-16 h-16 ${card.color}`} />
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              <card.icon className={`w-6 h-6 ${card.color}`} />
              <div>
                <h3 className="text-white/60 text-sm font-medium mb-1">{card.title}</h3>
                <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl xl:col-span-2 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b border-white/5 pb-4">Recent Workspace Activity</h2>
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm font-mono border border-white/5 border-dashed rounded-lg bg-black/20">
            [No recent activity detected]
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b border-white/5 pb-4">Agent Capabilities</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Codebase Analysis</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Autonomous Refactoring</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Real-time Terminal Execution</li>
            <li className="flex items-center gap-3 text-white/40"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Advanced Architecture Planning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

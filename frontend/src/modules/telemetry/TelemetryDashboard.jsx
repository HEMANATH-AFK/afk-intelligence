import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { Activity, Cpu, Database, Zap } from 'lucide-react';

export default function TelemetryDashboard() {
  const { metrics } = useTelemetryStore();

  return (
    <div className="p-4 flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Runtime Observability</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <MetricCard 
          icon={<Zap className="w-3 h-3" />} 
          label="THROUGHPUT" 
          value={`${metrics.tokens_per_sec} t/s`} 
          color="text-primary"
        />
        <MetricCard 
          icon={<Cpu className="w-3 h-3" />} 
          label="LATENCY" 
          value={`${metrics.latency}ms`} 
          color="text-accent"
        />
        <MetricCard 
          icon={<Database className="w-3 h-3" />} 
          label="MEMORY FUSION" 
          value={`${metrics.memory_usage}%`} 
          color="text-white/80"
        />
      </div>

      <div className="mt-auto p-3 bg-primary/5 border border-primary/10 rounded-lg">
        <div className="text-[9px] text-primary/60 font-mono mb-1">ACTIVE AGENT</div>
        <div className="text-xs font-bold font-mono tracking-wider">{metrics.active_agent}</div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="p-3 bg-surface border border-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-1 opacity-40">
        {icon}
        <span className="text-[8px] font-mono tracking-tighter">{label}</span>
      </div>
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

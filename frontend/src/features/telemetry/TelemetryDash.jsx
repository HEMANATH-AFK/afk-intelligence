import React from 'react';
import { motion } from 'framer-motion';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { Activity, Zap, Cpu, Clock } from 'lucide-react';

export default function TelemetryDash() {
  const { metrics } = useTelemetryStore();

  return (
    <div className="p-5 flex flex-col h-full space-y-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-cyan-500" />
        <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Runtime Telemetry</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          label="THROUGHPUT" 
          value={`${metrics.tokens_per_sec} t/s`} 
          sub="Token Stream"
          icon={<Zap className="w-3 h-3" />}
        />
        <MetricCard 
          label="LATENCY" 
          value={`${metrics.latency}ms`} 
          sub="Response Delay"
          icon={<Clock className="w-3 h-3" />}
        />
        <MetricCard 
          label="COGNITION" 
          value={`${metrics.memory_usage}%`} 
          sub="Memory Pressure"
          icon={<Cpu className="w-3 h-3" />}
        />
        <MetricCard 
          label="QUEUE" 
          value={metrics.queue_depth} 
          sub="Active Tasks"
          icon={<Activity className="w-3 h-3" />}
        />
      </div>

      {/* Real-time Oscilloscope for live Event Bus visualizer */}
      <div className="flex-1 min-h-[100px] border border-white/5 rounded-xl bg-white/[0.01] relative overflow-hidden flex items-end px-4 pb-4 gap-1">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              height: [
                `${((i * 7) % 60 + 20)}%`, 
                `${((i * 13) % 60 + 20)}%`, 
                `${((i * 3) % 60 + 20)}%`, 
                `${((i * 7) % 60 + 20)}%`
              ] 
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: i * 0.05 }}
            className="flex-1 bg-cyan-500/20 rounded-t-sm"
          />
        ))}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-widest">Live Event Bus</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon }) {
  return (
    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex items-center gap-2 text-white/20 mb-2">
        {icon}
        <span className="text-[8px] font-bold tracking-widest uppercase">{label}</span>
      </div>
      <div className="text-sm font-bold text-white/90 font-mono tracking-tight">{value}</div>
      <div className="text-[8px] text-white/20 font-mono uppercase mt-0.5">{sub}</div>
    </div>
  );
}

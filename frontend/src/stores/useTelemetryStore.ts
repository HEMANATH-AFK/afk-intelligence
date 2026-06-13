import { create } from 'zustand';

interface TelemetryMetrics {
  latency: number;
  tokens_per_sec: number;
  active_agent: string;
  memory_usage: number;
  tool_accuracy: number;
}

interface TelemetryState {
  metrics: TelemetryMetrics;
  updateMetrics: (newMetrics: Partial<TelemetryMetrics>) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  metrics: {
    latency: 0,
    tokens_per_sec: 0,
    active_agent: 'IDLE',
    memory_usage: 0,
    tool_accuracy: 100
  },
  updateMetrics: (newMetrics) => set((state) => ({
    metrics: { ...state.metrics, ...newMetrics }
  }))
}));

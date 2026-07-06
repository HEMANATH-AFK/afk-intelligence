import { useOrchestratorStore } from '../../stores/useOrchestratorStore';
import { Shield } from 'lucide-react';

export default function AuditCenter() {
  const { eventLog } = useOrchestratorStore();

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-3 h-3 text-primary" />
        <h3 className="text-[9px] font-bold tracking-widest text-white/30 uppercase">Immutable Audit Timeline</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {eventLog.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-white/10 font-mono italic">
            NO AUDIT RECORDS FOUND IN CURRENT SESSION
          </div>
        ) : (
          eventLog.map((event, i) => (
            <div key={i} className="flex gap-3 text-[10px] font-mono group">
              <span className="text-white/20 whitespace-nowrap">{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span className="text-primary/60 uppercase">[{event.event}]</span>
              <span className="text-white/60 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                {event.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

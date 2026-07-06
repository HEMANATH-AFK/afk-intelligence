import { useOrchestrationStore } from '../../stores/useOrchestrationStore';
import { ShieldAlert } from 'lucide-react';

export default function AuditTimeline() {
  const { messages } = useOrchestrationStore();
  
  // Extract all events from all messages for the global timeline
  const allEvents = messages.flatMap(m => m.events || []).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-3 h-3 text-cyan-500" />
        <h3 className="text-[9px] font-bold tracking-widest text-white/30 uppercase">Immutable System Audit</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        {allEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-white/10 font-mono italic">
            AWAITING SYSTEM INITIALIZATION...
          </div>
        ) : (
          allEvents.map((event, i) => (
            <div key={i} className="flex gap-4 py-1.5 border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors px-2 rounded group">
              <div className="text-[9px] font-mono text-white/20 whitespace-nowrap pt-0.5">
                {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="flex-1 flex items-start gap-3 overflow-hidden">
                <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${
                  event.event.includes('ALERT') ? 'bg-amber-500' : 'bg-cyan-500/40'
                }`} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-cyan-500/80 uppercase tracking-tighter">
                      {event.event}
                    </span>
                    {event.payload?.tool && (
                      <span className="text-[8px] px-1 bg-white/5 text-white/40 rounded border border-white/10 font-mono">
                        {event.payload.tool}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/60 font-mono truncate group-hover:whitespace-normal transition-all">
                    {event.message}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

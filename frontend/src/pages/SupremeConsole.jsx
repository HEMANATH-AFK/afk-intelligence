import React, { useState, useEffect } from 'react';
import { useOrchestrationStore } from '../stores/useOrchestrationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, CheckCircle2, Terminal, ShieldCheck, Database, Compass,
  MessageSquare, History, Check, X, ArrowUpRight, Cpu, BarChart3,
  AlertCircle, FileText, Activity, Code
} from 'lucide-react';

export default function SupremeConsole() {
  const {
    sessions,
    activeSessionId,
    activeWorkflow,
    isStreaming,
    streamLogs,
    activeSurface,
    activeInspectorTab,
    selectedPatch,
    createSession,
    selectSession,
    setActiveSurface,
    setInspectorTab,
    setSelectedPatch,
    startSSEStream,
    loadWorkflowReplay,
    approvePlan,
    rejectPlan,
    triggerWorkspaceIndex,
    healthStatus,
    checkHealth,
    presets,
    fetchPresets,
    tools,
    fetchTools,
    theme,
    setTheme
  } = useOrchestrationStore();

  const [prompt, setPrompt] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Auto-create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions, createSession]);

  // Fetch prompt presets
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Fetch tools schema registry
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Poll backend dependency health status (Postgres, Redis, Ollama) every 10 seconds to detect offline services
  useEffect(() => {
    checkHealth();
    const timer = setInterval(() => {
      checkHealth();
    }, 10000);
    return () => clearInterval(timer);
  }, [checkHealth]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    startSSEStream(prompt);
    setPrompt('');
  };


    <div className={`theme-${theme} flex h-screen w-screen bg-background text-slate-800 font-sans overflow-hidden select-none antialiased relative`}>
      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-0 z-50" />

      {/* LEFT SIDEBAR */}
      <motion.div 
        animate={{ width: sidebarExpanded ? 240 : 64 }}
        transition={{ duration: 0.2, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="flex flex-col h-full bg-surface border-r border-slate-200 shrink-0 z-10 shadow-sm"
      >
        {/* Workspace Title */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Cpu className="w-3 h-3 text-primary" />
            </div>
            {sidebarExpanded && (
              <span className="text-xs font-bold tracking-tight text-slate-900 truncate">AFK Cognitive Layer</span>
            )}
          </div>
          {sidebarExpanded && (
            <button 
              onClick={() => setSidebarExpanded(false)}
              className="text-slate-400 hover:text-slate-600 text-[10px] uppercase font-mono px-1.5 py-0.5 border border-slate-200 rounded cursor-pointer"
            >
              Collapse
            </button>
          )}
          {!sidebarExpanded && (
            <button 
              onClick={() => setSidebarExpanded(true)}
              className="text-slate-400 hover:text-slate-650 text-xs shrink-0 cursor-pointer"
            >
              →
            </button>
          )}
        </div>

        {/* Sessions Section */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          <div>
            {sidebarExpanded && (
              <h3 className="px-2 text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2">Sessions</h3>
            )}
            <div className="space-y-0.5">
              {sessions.map(s => {
                const isActive = s.id === activeSessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-slate-100/80 text-slate-900 border-slate-200 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-slate-450'}`} />
                    {sidebarExpanded && (
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold truncate">{s.repository_path}</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          {s.prompt_history.length > 0 ? s.prompt_history[s.prompt_history.length - 1] : 'No activity yet'}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
              <button 
                onClick={createSession}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-primary hover:bg-slate-50 transition-all cursor-pointer border border-transparent font-medium"
              >
                <span className="text-xs shrink-0 font-bold">+</span>
                {sidebarExpanded && <span className="text-xs font-semibold">New Session</span>}
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <div>
            {sidebarExpanded && (
              <h3 className="px-2 text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2">Views</h3>
            )}
            <div className="space-y-0.5">
              <SidebarLink 
                icon={<Activity />} 
                label="Live Workflow" 
                active={activeSurface === 'LIVE'} 
                sidebarExpanded={sidebarExpanded}
                onClick={() => setActiveSurface('LIVE')} 
              />
              <SidebarLink 
                icon={<History />} 
                label="Replay Engine" 
                active={activeSurface === 'REPLAY'} 
                sidebarExpanded={sidebarExpanded}
                onClick={() => setActiveSurface('REPLAY')} 
              />
              <SidebarLink 
                icon={<Compass />} 
                label="Repo Graph" 
                active={activeSurface === 'WORKSPACE'} 
                sidebarExpanded={sidebarExpanded}
                onClick={() => setActiveSurface('WORKSPACE')} 
              />
              <SidebarLink 
                icon={<ShieldCheck />} 
                label="Patch Review" 
                active={activeSurface === 'MODIFICATION'} 
                sidebarExpanded={sidebarExpanded}
                onClick={() => setActiveSurface('MODIFICATION')} 
              />
            </div>
          </div>
        </div>

        {/* Live System Health Widget */}
        <div className="p-3 border-t border-slate-250 bg-slate-50/50 space-y-2.5">
          {sidebarExpanded && (
            <div className="flex items-center justify-between text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              <span>System Telemetry</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                !healthStatus ? 'bg-slate-300' :
                healthStatus.status === 'ok' ? 'bg-emerald-500 animate-pulse' :
                healthStatus.status === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'
              }`} />
            </div>
          )}
          
          <div className="space-y-1.5">
            {/* Postgres status */}
            <div className="flex items-center justify-between text-[10px] text-slate-650">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-400" />
                {sidebarExpanded && <span className="font-mono">db_postgres</span>}
              </div>
              {sidebarExpanded && (
                <span className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide ${
                  healthStatus?.dependencies?.postgres === 'ok' 
                    ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 shadow-none' 
                    : 'bg-rose-50 border border-rose-250 text-rose-700 animate-pulse'
                }`}>
                  {healthStatus?.dependencies?.postgres === 'ok' ? 'ONLINE' : 'OFFLINE'}
                </span>
              )}
            </div>

            {/* Redis status */}
            <div className="flex items-center justify-between text-[10px] text-slate-650">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-slate-400" />
                {sidebarExpanded && <span className="font-mono">redis_pubsub</span>}
              </div>
              {sidebarExpanded && (
                <span className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide ${
                  healthStatus?.dependencies?.redis === 'ok' 
                    ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 shadow-none' 
                    : 'bg-rose-50 border border-rose-250 text-rose-700 animate-pulse'
                }`}>
                  {healthStatus?.dependencies?.redis === 'ok' ? 'ONLINE' : 'OFFLINE'}
                </span>
              )}
            </div>

            {/* Ollama status */}
            <div className="flex items-center justify-between text-[10px] text-slate-650">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-slate-400" />
                {sidebarExpanded && <span className="font-mono">ollama_llm</span>}
              </div>
              {sidebarExpanded && (
                <span className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide ${
                  healthStatus?.dependencies?.ollama === 'ok' 
                    ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 shadow-none' 
                    : 'bg-rose-50 border border-rose-250 text-rose-700 animate-pulse'
                }`}>
                  {healthStatus?.dependencies?.ollama === 'ok' ? 'ONLINE' : 'OFFLINE'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Workspace indexing trigger */}
        <div className="p-2 border-t border-border bg-white/[0.01]">
          <button
            onClick={triggerWorkspaceIndex}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:shadow-[0_0_12px_var(--color-glow)] transition-all text-xs text-primary font-bold cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            {sidebarExpanded && <span>Index Workspace</span>}
          </button>
        </div>
      </motion.div>

      {/* CENTER WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Header Status Bar */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide text-primary">
              {activeSurface === 'LIVE' && 'Active Cognition Terminal'}
              {activeSurface === 'REPLAY' && 'Historical Replay Hub'}
              {activeSurface === 'WORKSPACE' && 'Repository Graph Explorer'}
              {activeSurface === 'MODIFICATION' && 'Modification Approvals Sandbox'}
            </span>
            <div className="w-[1px] h-3 bg-slate-200" />
            {activeWorkflow && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Workflow_ID:</span>
                <span className="text-[10px] font-mono text-accent font-semibold">{activeWorkflow.workflow_id.slice(0, 8)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isStreaming && (
              <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Thinking
              </div>
            )}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-2.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono text-slate-600 hover:text-slate-800 hover:border-slate-350 focus:outline-none transition-all cursor-pointer"
            >
              <option value="cyber-neon" className="bg-[#ffffff] text-slate-900 font-mono">Cyber-Neon</option>
              <option value="amethyst" className="bg-[#ffffff] text-slate-900 font-mono">Amethyst</option>
              <option value="aurora" className="bg-[#ffffff] text-slate-900 font-mono">Aurora Polar</option>
              <option value="slate" className="bg-[#ffffff] text-slate-900 font-mono">Space Slate</option>
              <option value="light-nordic" className="bg-[#ffffff] text-slate-900 font-mono">Nordic Light</option>
              <option value="light-cyber" className="bg-[#ffffff] text-slate-900 font-mono">Cyber Light</option>
            </select>
            <div className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-mono text-slate-400">
              V0.2.0
            </div>
          </div>
        </div>

        {/* Core Workspace Surface */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            {activeSurface === 'LIVE' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                 {/* Prompt Execution Bar */}
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isStreaming}
                    placeholder="Ask AFK to plan or propose changes (e.g. 'Add JWT refresh tokens')"
                    className="w-full h-12 pl-5 pr-14 rounded-xl bg-white border border-slate-250 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm focus:outline-none text-slate-900 transition-all placeholder-slate-400 shadow-md shadow-slate-100/65 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !prompt.trim()}
                    className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/95 text-white disabled:bg-slate-100 disabled:text-slate-400 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Prompt Presets Quick-Select Bar */}
                {presets && presets.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Workflow Presets</span>
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPrompt(p.prompt)}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-primary/50 hover:shadow-md hover:shadow-slate-100/60 text-left transition-all cursor-pointer group shadow-sm shadow-slate-100/40"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{p.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight truncate">{p.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Timeline execution */}
                {activeWorkflow ? (
                  <div className="space-y-6">
                    {/* Stage Header */}
                    <div className="p-5 rounded-lg bg-panel-bg1 border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white/90 truncate mr-4">{activeWorkflow.goal}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          {activeWorkflow.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        AFK is reasoning through this goal using a multi-agent loop, matching AST declarations with semantic pgvector contexts.
                      </p>
                    </div>

                    {/* Timeline representation */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Cognitive Stages</h3>
                      <div className="relative pl-6 border-l border-slate-200 space-y-6">
                        {/* 1. Context Retrieval Stage */}
                        <TimelineNode 
                          title="Semantic & Structural Context Retrieval"
                          status={activeWorkflow.status === 'PENDING' ? 'pending' : 'completed'}
                          description="Queried pgvector indexing for matches and traversed the imports architecture tree."
                        />

                        {/* 2. Planning Stage */}
                        <TimelineNode 
                          title="Orchestration Planning"
                          status={['PENDING', 'RETRIEVING'].includes(activeWorkflow.status) ? 'pending' : (activeWorkflow.status === 'PLANNING' ? 'active' : 'completed')}
                          description="Planner Agent formulated modular tasks, mapping dependencies to prevent code breakage."
                          payload={activeWorkflow.planner_raw_output}
                        />

                        {/* 3. Execution Stage */}
                        <TimelineNode 
                          title="Tool & AST Execution"
                          status={['PENDING', 'RETRIEVING', 'PLANNING'].includes(activeWorkflow.status) ? 'pending' : (activeWorkflow.status === 'EXECUTING' ? 'active' : 'completed')}
                          description="Executor runtime applied target validation algorithms to construct changes."
                        />

                        {/* 4. Reflection Stage */}
                        <TimelineNode 
                          title="Final Reflection & Validation"
                          status={['PENDING', 'RETRIEVING', 'PLANNING', 'EXECUTING'].includes(activeWorkflow.status) ? 'pending' : (activeWorkflow.status === 'REFLECTING' ? 'active' : 'completed')}
                          description="Compiled the final solution, verifying syntax alignment against standard specifications."
                          payload={activeWorkflow.reflection}
                        />
                      </div>
                    </div>

                    {/* Active streaming response */}
                    <div className="p-5 rounded-lg bg-panel-bg1 border border-white/[0.06] space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                        <Terminal className="w-4 h-4 text-white/30" />
                        <h4 className="text-xs font-semibold text-white/80">Cognitive Stream Output</h4>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {streamLogs.filter(log => log.event_type === 'token').map((log, i) => (
                          <div key={i} className="text-xs font-mono text-white/70 leading-relaxed whitespace-pre-wrap">
                            {log.message}
                          </div>
                        ))}
                        {isStreaming && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            Streaming final answers...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-white/20">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-semibold text-white/60">No Active Orchestrations</h3>
                    <p className="text-[11px] text-white/30 max-w-[280px]">
                      Enter a prompt above to start the multi-agent cognitive loop. The runtime will cite context, analyze dependencies, and request approvals.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeSurface === 'REPLAY' && (
              <motion.div
                key="replay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Replay selectors */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Select Workflow History</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {sessions.flatMap(s => s.workflows).map(w => (
                      <button
                        key={w.workflow_id}
                        onClick={() => loadWorkflowReplay(w.workflow_id)}
                        className="p-4 rounded-lg bg-panel-bg1 border border-white/[0.06] hover:border-indigo-500/20 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-indigo-400 group-hover:text-indigo-300">
                            {w.workflow_id.slice(0, 8)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                            {w.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-white/80 line-clamp-1">{w.goal}</h4>
                      </button>
                    ))}
                    {sessions.flatMap(s => s.workflows).length === 0 && (
                      <div className="col-span-2 p-8 text-center text-xs text-white/30 border border-dashed border-white/[0.06] rounded-lg">
                        No executed workflows available. Run a workspace prompt first.
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Replay Visualizer */}
                {activeWorkflow && activeSurface === 'REPLAY' && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-lg bg-indigo-500/[0.02] border border-indigo-500/10 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-white/90">Replaying History Pipeline</h3>
                        <p className="text-[11px] text-white/40">You are scrubbing chronological logs and telemetry for: "{activeWorkflow.goal}"</p>
                      </div>
                      <RotateCcw className="w-4 h-4 text-white/30 hover:text-white/60 cursor-pointer" />
                    </div>

                    {/* Timeline replay */}
                    <div className="relative pl-6 border-l border-white/[0.06] space-y-6">
                      <TimelineNode 
                        title="Replay: Semantic Context"
                        status="completed"
                        description="Vectored segments merged with architecture import nodes successfully."
                      />
                      <TimelineNode 
                        title="Replay: Planner Directives"
                        status="completed"
                        description="Parsed goal into granular files."
                        payload={activeWorkflow.planner_raw_output}
                      />
                      <TimelineNode 
                        title="Replay: Patch Modifications"
                        status="completed"
                        description="Analyzed file boundaries and generated safe rollback snapshots."
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeSurface === 'WORKSPACE' && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Repository Graph Explorer */}
                <div className="p-6 rounded-lg bg-panel-bg1 border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-white/90">Structural Architecture Map</h3>
                      <p className="text-[11px] text-white/40">Visualized dependency graph linking routes, class models, services, and models.</p>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-semibold">
                      <Activity className="w-3.5 h-3.5" />
                      AST ACTIVE
                    </div>
                  </div>

                  {/* Dummy high-fidelity structural representation */}
                  <div className="h-[320px] rounded bg-panel-bg2 border border-white/[0.06] flex items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    
                    <div className="relative flex flex-col items-center gap-8">
                      <div className="flex items-center gap-12">
                        <GraphNode label="main.py" type="file" />
                        <GraphNode label="core/database.py" type="file" />
                      </div>
                      <div className="flex items-center gap-8">
                        <GraphNode label="modules/context/presentation.py" type="file" active />
                        <GraphNode label="modules/modification/domain/entities.py" type="file" active />
                      </div>
                      <div className="flex items-center gap-12">
                        <GraphNode label="services/impact.py" type="class" />
                        <GraphNode label="services/sandbox.py" type="class" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSurface === 'MODIFICATION' && (
              <motion.div
                key="modification"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Modification proposal reviews */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-white/90">Patch Proposal Review Sandbox</h3>
                      <p className="text-[11px] text-white/40">Review unified simulated patches. Every write operation is isolated and includes automatic backups.</p>
                    </div>
                  </div>

                  {activeWorkflow && activeWorkflow.patches && activeWorkflow.patches.length > 0 ? (
                    <div className="space-y-4">
                      {activeWorkflow.patches.map((patch, idx) => (
                        <div key={idx} className="p-5 rounded-lg bg-panel-bg1 border border-white/[0.06] space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-white/30" />
                              <span className="text-xs font-semibold text-white/90">{patch.filepath}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                              Confidence: {patch.confidence?.score || 0.9}
                            </span>
                          </div>

                          <div className="p-4 rounded bg-panel-bg2/80 border border-white/[0.06] overflow-x-auto max-h-[350px]">
                            {renderDiff(patch.diff)}
                          </div>

                          {/* Risk evaluation panel */}
                          {patch.confidence?.risk_notes && (
                            <div className="p-3 rounded bg-amber-500/[0.02] border border-amber-500/10 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Blast Risk assessment</span>
                                <ul className="list-disc list-inside text-[10px] text-white/40 space-y-0.5">
                                  {patch.confidence.risk_notes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Approval Confirmation */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => approvePlan(activeWorkflow.workflow_id)}
                              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve & Apply Safe Write
                            </button>
                            <button
                              onClick={() => rejectPlan(activeWorkflow.workflow_id)}
                              className="px-4 py-2 rounded bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-xs font-semibold text-white/70 cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-white/30 border border-dashed border-white/[0.06] rounded-lg">
                      No patch proposals waiting review. Generate or select a modification workflow.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT INSPECTOR PANEL */}
      <div className="w-[340px] border-l border-white/[0.06] bg-panel-bg1 flex flex-col h-full shrink-0">
        {/* Tabs Bar */}
        <div className="h-14 border-b border-white/[0.06] flex items-center justify-around shrink-0 px-1">
          <InspectorTabButton active={activeInspectorTab === 'CONTEXT'} label="Context" onClick={() => setInspectorTab('CONTEXT')} />
          <InspectorTabButton active={activeInspectorTab === 'TOOLS'} label="Tools" onClick={() => setInspectorTab('TOOLS')} />
          <InspectorTabButton active={activeInspectorTab === 'RELIABILITY'} label="Reliability" onClick={() => setInspectorTab('RELIABILITY')} />
          <InspectorTabButton active={activeInspectorTab === 'DIFF'} label="Patches" onClick={() => setInspectorTab('DIFF')} />
          <InspectorTabButton active={activeInspectorTab === 'AUDIT'} label="Audit" onClick={() => setInspectorTab('AUDIT')} />
        </div>

        {/* Dynamic inspector content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeInspectorTab === 'CONTEXT' && (
              <motion.div
                key="context"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Retrieved Context Evidence</span>
                </div>

                <div className="space-y-2">
                  <EvidenceCard path="backend/src/main.py" score="0.94" type="file" />
                  <EvidenceCard path="modules/context/services/assembler.py" score="0.87" type="class" />
                  <EvidenceCard path="core/database.py" score="0.75" type="file" />
                </div>
              </motion.div>
            )}

            {activeInspectorTab === 'TOOLS' && (
              <motion.div
                key="tools"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Tools Registry</span>
                </div>

                <div className="space-y-2">
                  {tools && tools.length > 0 ? (
                    tools.map((t, idx) => (
                      <div key={idx} className="p-3 rounded bg-panel-bg2 border border-white/[0.06] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white/90 font-mono">{t.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed">{t.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-white/30 border border-dashed border-white/[0.06] rounded-lg">
                      No registered tools found.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeInspectorTab === 'RELIABILITY' && (
              <motion.div
                key="reliability"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Reliability Score Dashboard</span>
                </div>

                {activeWorkflow && activeWorkflow.reliability ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-lg bg-panel-bg2 border border-white/[0.06] space-y-4">
                      <div className="flex flex-col items-center justify-center space-y-2 relative">
                        {/* Circular/Arc Gauge */}
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {/* Background Track */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="56"
                              cy="56"
                              r="48"
                              className="stroke-white/[0.04]"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            {/* Color Boundaries Meter */}
                            <motion.circle
                              cx="56"
                              cy="56"
                              r="48"
                              className={`${
                                activeWorkflow.reliability.reliability_score >= 0.8 ? 'stroke-[#10b981]' :
                                activeWorkflow.reliability.reliability_score >= 0.5 ? 'stroke-[#f59e0b]' : 'stroke-[#ef4444]'
                              }`}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 48}
                              initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - activeWorkflow.reliability.reliability_score) }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-extrabold tracking-tight text-white/90">
                              {Math.round(activeWorkflow.reliability.reliability_score * 100)}%
                            </span>
                            <span className="text-[8px] text-white/30 font-semibold uppercase tracking-wider">Reliability</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/[0.04] pt-3">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                          <span>Unsafe</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                          <span>Caution</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                          <span>Safe</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <MetricRow label="Grounding Quality" value={activeWorkflow.reliability.grounding_quality} highlight />
                      <MetricRow label="Hallucination Risk" value={activeWorkflow.reliability.hallucination_risk} alert={activeWorkflow.reliability.hallucination_risk === 'HIGH'} />
                    </div>

                    <div className="p-4 rounded-lg bg-panel-bg2 border border-white/[0.06] space-y-2">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Confidence Breakdown</span>
                      <ul className="space-y-1 text-[11px] text-white/60 list-disc list-inside leading-relaxed">
                        {activeWorkflow.reliability.confidence_breakdown.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-white/30 border border-dashed border-white/[0.06] rounded-lg">
                    No active score. Run a workflow to trigger reliability grading.
                  </div>
                )}
              </motion.div>
            )}

            {activeInspectorTab === 'DIFF' && (
              <motion.div
                key="diff"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Active patch lists</span>
                </div>

                {activeWorkflow && activeWorkflow.patches && activeWorkflow.patches.length > 0 ? (
                  <div className="space-y-2">
                    {activeWorkflow.patches.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPatch(p)}
                        className={`w-full p-3 rounded-lg text-left border transition-all cursor-pointer ${
                          selectedPatch?.filepath === p.filepath 
                            ? 'bg-panel-bg2 border-indigo-500/30' 
                            : 'bg-panel-bg2/40 border-white/[0.06] hover:border-white/[0.1]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-white/80 truncate">{p.filepath.split('/').pop()}</p>
                        <p className="text-[10px] text-white/40 truncate">{p.filepath}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-white/30 border border-dashed border-white/[0.06] rounded-lg">
                    No active proposed patches available.
                  </div>
                )}
              </motion.div>
            )}

            {activeInspectorTab === 'AUDIT' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Immutable Audit Trail</span>
                </div>

                <div className="relative pl-4 border-l border-white/[0.06] space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {streamLogs.filter(log => log.event_type !== 'token').map((log, i) => (
                    <div key={i} className="space-y-0.5">
                      <span className="text-[8px] font-mono text-white/30">{log.timestamp}</span>
                      <p className="text-[11px] font-medium text-white/70 leading-relaxed">{log.message}</p>
                    </div>
                  ))}
                  {streamLogs.filter(log => log.event_type !== 'token').length === 0 && (
                    <div className="text-xs text-white/30 py-4">No audit events logged.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ icon, label, active, sidebarExpanded, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer relative ${
        active 
          ? 'bg-primary/10 border border-primary/20 text-primary shadow-sm font-semibold' 
          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
      }`}
    >
      {React.cloneElement(icon, { className: `w-3.5 h-3.5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-slate-400'}` })}
      {sidebarExpanded && <span className="text-xs font-semibold tracking-tight">{label}</span>}
      {active && sidebarExpanded && (
        <span className="absolute right-2.5 w-1 h-3.5 rounded bg-primary" />
      )}
    </button>
  );
}

function TimelineNode({ title, status, description, payload }) {
  return (
    <div className="relative space-y-1">
      <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full border bg-background transition-all"
        style={{
          borderColor: status === 'active' ? 'var(--primary-color)' : (status === 'completed' ? 'var(--accent-color)' : 'var(--border-color)'),
          boxShadow: status === 'active' ? '0 0 0 4px var(--color-glow)' : 'none'
        }}
      />
      <div className="flex items-center gap-2">
        <h4 className={`text-xs font-semibold ${status === 'active' ? 'text-primary font-bold' : 'text-slate-700'}`}>{title}</h4>
        {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-accent" />}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      {payload && (
        <div className="p-3 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto max-w-full shadow-sm">
          <pre>{JSON.stringify(payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function GraphNode({ label, type, active }) {
  return (
    <div className={`px-3 py-1.5 rounded border text-[10px] font-mono transition-all flex items-center gap-1.5 ${
      active 
        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
        : 'bg-panel-bg1 border-white/[0.06] text-white/60'
    }`}>
      {type === 'file' ? <FileText className="w-3 h-3 shrink-0 text-white/30" /> : <Code className="w-3 h-3 shrink-0 text-indigo-400" />}
      {label}
    </div>
  );
}

function InspectorTabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[10px] font-semibold tracking-tight transition-all cursor-pointer border-b-2 ${
        active 
          ? 'border-indigo-500 text-indigo-400' 
          : 'border-transparent text-white/40 hover:text-white/60'
      }`}
    >
      {label}
    </button>
  );
}

function EvidenceCard({ path, score, type }) {
  return (
    <div className="p-3 rounded bg-panel-bg2 border border-white/[0.06] flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        {type === 'file' ? <FileText className="w-3.5 h-3.5 text-white/20 shrink-0" /> : <Code className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
        <span className="text-[11px] font-medium text-white/70 truncate">{path.split('/').pop()}</span>
      </div>
      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-white/[0.04] border border-white/[0.06] text-white/50 shrink-0">
        Relevance: {score}
      </span>
    </div>
  );
}

function MetricRow({ label, value, highlight, alert }) {
  return (
    <div className="flex items-center justify-between p-3 rounded bg-panel-bg2 border border-white/[0.06]">
      <span className="text-[11px] text-white/40 font-medium">{label}</span>
      <span className={`text-[10px] font-bold uppercase ${
        alert ? 'text-rose-400' : (highlight ? 'text-indigo-400' : 'text-emerald-400')
      }`}>
        {value}
      </span>
    </div>
  );
}

function renderDiff(diffText) {
  if (!diffText) return null;
  const lines = diffText.split('\n');
  return (
    <div className="font-mono text-[11px] select-text">
      {lines.map((line, idx) => {
        let lineClass = 'text-white/60';
        let bgClass = '';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineClass = 'text-[#10b981] font-medium';
          bgClass = 'bg-[#10b981]/5 px-1 rounded-sm border-l-2 border-[#10b981]/30';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineClass = 'text-[#ef4444] font-medium';
          bgClass = 'bg-[#ef4444]/5 px-1 rounded-sm border-l-2 border-[#ef4444]/30';
        } else if (line.startsWith('@@')) {
          lineClass = 'text-indigo-400/80 font-semibold';
          bgClass = 'bg-indigo-500/5 px-1 rounded-sm';
        }
        return (
          <div key={idx} className={`py-0.5 leading-relaxed truncate ${bgClass} ${lineClass}`}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

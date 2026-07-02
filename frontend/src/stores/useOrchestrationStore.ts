import { create } from 'zustand';

export interface WorkflowStep {
  id: string;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  tool_call?: any;
  result?: any;
}

export interface Workflow {
  workflow_id: string;
  goal: string;
  status: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  planner_raw_output?: any;
  reflection?: any;
  reliability?: {
    reliability_score: number;
    hallucination_risk: string;
    grounding_quality: string;
    confidence_breakdown: string[];
  };
  audit_trail?: any[];
  patches?: any[];
}

export interface Session {
  id: string;
  repository_path: string;
  prompt_history: string[];
  summaries: Record<string, string>;
  workflows: Workflow[];
}

export interface ToolSchema {
  name: string;
  description: string;
}

export interface PresetPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export interface HealthState {
  status: 'ok' | 'degraded' | 'error' | 'loading';
  dependencies: {
    postgres: 'ok' | 'error';
    redis: 'ok' | 'error';
    ollama: 'ok' | 'error';
  };
}

type StreamStatus = 'CONNECTING' | 'STREAMING' | 'RECONNECTING' | 'DISCONNECTED' | 'COMPLETED' | 'FAILED';

interface OrchestrationState {
  sessions: Session[];
  activeSessionId: string | null;
  activeWorkflow: Workflow | null;
  isStreaming: boolean;
  sseStatus: StreamStatus;
  streamLogs: Array<{ timestamp: string; event_type: string; message: string; payload?: any }>;
  
  // Navigation Surfaces
  activeSurface: 'LIVE' | 'REPLAY' | 'WORKSPACE' | 'MODIFICATION' | 'SETTINGS';
  activeInspectorTab: 'CONTEXT' | 'RELIABILITY' | 'DIFF' | 'AUDIT' | 'TOOLS';
  
  // Selected patch for diff viewer
  selectedPatch: any | null;

  // UI Theme state
  theme: 'amethyst' | 'cyber-neon' | 'aurora' | 'slate' | 'light-nordic' | 'light-cyber';

  // Premium Features state
  tools: ToolSchema[];
  presets: PresetPrompt[];
  healthStatus: HealthState | null;

  // Actions
  createSession: () => string;
  selectSession: (sessionId: string) => void;
  setActiveSurface: (surface: 'LIVE' | 'REPLAY' | 'WORKSPACE' | 'MODIFICATION' | 'SETTINGS') => void;
  setInspectorTab: (tab: 'CONTEXT' | 'RELIABILITY' | 'DIFF' | 'AUDIT' | 'TOOLS') => void;
  setSelectedPatch: (patch: any | null) => void;
  setTheme: (theme: 'amethyst' | 'cyber-neon' | 'aurora' | 'slate' | 'light-nordic' | 'light-cyber') => void;
  startSSEStream: (prompt: string) => Promise<void>;
  closeWorkflowStream: () => void;
  loadWorkflowReplay: (workflowId: string) => Promise<void>;
  approvePlan: (planId: string) => Promise<void>;
  rejectPlan: (planId: string) => Promise<void>;
  triggerWorkspaceIndex: () => Promise<void>;
  fetchTools: () => Promise<void>;
  fetchPresets: () => Promise<void>;
  checkHealth: () => Promise<void>;
}

// Global EventSource reference for cancellation
let activeEventSource: EventSource | null = null;
let reconnectTimer: any = null;

/**
 * Zustand store to manage multi-agent orchestration state, including SSE streaming,
 * sessions, health checks, presets, and active workflow timelines.
 */
export const useOrchestrationStore = create<OrchestrationState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeWorkflow: null,
  isStreaming: false,
  sseStatus: 'DISCONNECTED',
  streamLogs: [],
  activeSurface: 'LIVE',
  activeInspectorTab: 'CONTEXT',
  theme: 'cyber-neon',
  tools: [],
  presets: [],
  healthStatus: null,

  createSession: () => {
    const newId = crypto.randomUUID();
    const newSession: Session = {
      id: newId,
      repository_path: 'AFK-Intelligence',
      prompt_history: [],
      summaries: {},
      workflows: []
    };
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: newId,
      activeWorkflow: null,
      streamLogs: []
    }));
    return newId;
  },

  selectSession: (id) => {
    const session = get().sessions.find(s => s.id === id);
    set({
      activeSessionId: id,
      activeWorkflow: session?.workflows[0] || null,
      streamLogs: []
    });
  },

  setActiveSurface: (surface) => set({ activeSurface: surface }),
  setInspectorTab: (tab) => set({ activeInspectorTab: tab }),
  setSelectedPatch: (patch) => set({ selectedPatch: patch }),
  setTheme: (theme) => set({ theme }),

  closeWorkflowStream: () => {
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    set({
      isStreaming: false,
      sseStatus: 'DISCONNECTED'
    });
    console.log('[OBSERVABILITY] SSE stream closed manually.');
  },

  startSSEStream: async (prompt) => {
    // 1. Terminate any previous streams
    get().closeWorkflowStream();

    set({
      isStreaming: true,
      sseStatus: 'CONNECTING',
      streamLogs: []
    });

    console.log(`[OBSERVABILITY] Initiating workflow creation request for goal: '${prompt}'`);

    let workflowId = '';
    try {
      // 2. Separate workflow creation via POST request
      const createRes = await fetch('http://localhost:8000/api/v1/chat/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (!createRes.ok) {
        throw new Error(`Creation failed: ${createRes.statusText}`);
      }

      const createData = await createRes.json();
      workflowId = createData.workflow_id;
      
      set({
        activeWorkflow: {
          workflow_id: workflowId,
          goal: prompt,
          status: 'PENDING',
          steps: [],
          currentStepIndex: 0
        }
      });
      
      console.log(`[OBSERVABILITY] Workflow persisted successfully. ID: ${workflowId}. Connecting stream...`);
    } catch (err: any) {
      console.error('[OBSERVABILITY] Failed to create workflow:', err);
      set({
        isStreaming: false,
        sseStatus: 'FAILED',
        streamLogs: [{
          timestamp: new Date().toLocaleTimeString(),
          event_type: 'error',
          message: `Initialization failed: ${err.message}`
        }]
      });
      return;
    }

    // 3. Connect to the clean GET stream endpoint with exponential backoff reconnect logic
    let reconnectAttempts = 0;
    
    const connectStream = () => {
      if (!workflowId) return;
      
      console.log(`[OBSERVABILITY] Opening EventSource channel: /workflows/${workflowId}/stream`);
      const eventSource = new EventSource(`http://localhost:8000/api/v1/chat/workflows/${workflowId}/stream`);
      activeEventSource = eventSource;

      eventSource.onopen = () => {
        reconnectAttempts = 0;
        set({ sseStatus: 'STREAMING' });
        console.log('[OBSERVABILITY] SSE Stream successfully connected.');
      };

      // Set up listeners for individual named event types yielded by FastAPI
      const handleEvent = (event_type: string, payloadStr: string) => {
        try {
          const data = JSON.parse(payloadStr);
          const timestamp = new Date().toLocaleTimeString();

          set((state) => ({
            streamLogs: [...state.streamLogs, {
              timestamp,
              event_type,
              message: data.message || '',
              payload: data.payload
            }]
          }));

          if (event_type === 'system_state') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              return {
                activeWorkflow: {
                  ...state.activeWorkflow,
                  status: data.state
                }
              };
            });
          }

          if (event_type === 'telemetry') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              return {
                activeWorkflow: {
                  ...state.activeWorkflow,
                  steps: data.payload.steps || []
                }
              };
            });
          }

          if (event_type === 'tool_execution_started') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              const steps = state.activeWorkflow.steps.map(s => 
                s.id === data.payload.id ? { ...s, status: 'ACTIVE' as const } : s
              );
              return { activeWorkflow: { ...state.activeWorkflow, steps } };
            });
          }

          if (event_type === 'tool_execution_completed') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              const steps = state.activeWorkflow.steps.map(s => 
                s.id === data.payload.task_id ? { 
                  ...s, 
                  status: data.payload.status === 'success' ? 'COMPLETED' as const : 'FAILED' as const,
                  result: data.payload.result || data.payload.error
                } : s
              );
              return { activeWorkflow: { ...state.activeWorkflow, steps } };
            });
          }

          if (event_type === 'planner_raw_output') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              return {
                activeWorkflow: {
                  ...state.activeWorkflow,
                  planner_raw_output: data.payload
                }
              };
            });
          }

          if (event_type === 'reflection_completed') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              return {
                activeWorkflow: {
                  ...state.activeWorkflow,
                  reflection: data.payload
                }
              };
            });
          }

          if (event_type === 'reliability_calculated') {
            set((state) => {
              if (!state.activeWorkflow) return state;
              return {
                activeWorkflow: {
                  ...state.activeWorkflow,
                  reliability: data.payload
                }
              };
            });
          }

          if (event_type === 'workflow_completed') {
            eventSource.close();
            set((state) => {
              const completedWorkflow = state.activeWorkflow ? {
                ...state.activeWorkflow,
                status: 'COMPLETED'
              } : null;
              
              const sessions = state.sessions.map(s => {
                if (s.id === state.activeSessionId && completedWorkflow) {
                  return {
                    ...s,
                    prompt_history: [...s.prompt_history, completedWorkflow.goal],
                    workflows: [completedWorkflow, ...s.workflows]
                  };
                }
                return s;
              });

              return {
                isStreaming: false,
                sseStatus: 'COMPLETED',
                activeWorkflow: completedWorkflow,
                sessions
              };
            });
            console.log('[OBSERVABILITY] SSE stream completed cleanly.');
          }

          if (event_type === 'workflow_failed') {
            eventSource.close();
            set((state) => ({
              isStreaming: false,
              sseStatus: 'FAILED',
              activeWorkflow: state.activeWorkflow ? {
                ...state.activeWorkflow,
                status: 'FAILED'
              } : null
            }));
            console.error('[OBSERVABILITY] SSE stream received explicit failure.');
          }

        } catch (e) {
          console.error('[OBSERVABILITY] Failed to parse SSE payload:', e);
        }
      };

      // Listeners for named SSE streams
      eventSource.addEventListener('system_state', (e) => handleEvent('system_state', e.data));
      eventSource.addEventListener('telemetry', (e) => handleEvent('telemetry', e.data));
      eventSource.addEventListener('tool_execution_started', (e) => handleEvent('tool_execution_started', e.data));
      eventSource.addEventListener('tool_execution_completed', (e) => handleEvent('tool_execution_completed', e.data));
      eventSource.addEventListener('planner_raw_output', (e) => handleEvent('planner_raw_output', e.data));
      eventSource.addEventListener('reflection_completed', (e) => handleEvent('reflection_completed', e.data));
      eventSource.addEventListener('reliability_calculated', (e) => handleEvent('reliability_calculated', e.data));
      eventSource.addEventListener('workflow_completed', (e) => handleEvent('workflow_completed', e.data));
      eventSource.addEventListener('workflow_failed', (e) => handleEvent('workflow_failed', e.data));
      eventSource.addEventListener('token', (e) => handleEvent('token', e.data));

      eventSource.onerror = (err) => {
        console.error('[OBSERVABILITY] SSE stream error details:', err);
        eventSource.close();
        
        // Resilience: Exponential backoff reconnect
        if (reconnectAttempts < 5) {
          reconnectAttempts++;
          const delay = Math.pow(2, reconnectAttempts) * 1000;
          set({ sseStatus: 'RECONNECTING' });
          console.warn(`[OBSERVABILITY] SSE disconnected unexpectedly. Attempting reconnect #${reconnectAttempts} in ${delay}ms...`);
          
          reconnectTimer = setTimeout(() => {
            connectStream();
          }, delay);
        } else {
          set({
            isStreaming: false,
            sseStatus: 'FAILED'
          });
          console.error('[OBSERVABILITY] SSE reconnect threshold reached. Connection terminated.');
        }
      };
    };

    connectStream();
  },

  loadWorkflowReplay: async (workflowId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orchestration/workflow/${workflowId}/replay`);
      if (res.ok) {
        const data = await res.json();
        const replayed: Workflow = {
          workflow_id: data.workflow_id,
          goal: data.request,
          status: data.status,
          steps: data.planner_output?.tasks?.map((t: any) => ({
            id: t.id,
            description: `Use ${t.type}`,
            status: data.execution_results?.find((r: any) => r.task_id === t.id)?.status === 'success' ? 'COMPLETED' : 'FAILED',
            result: data.execution_results?.find((r: any) => r.task_id === t.id)?.result
          })) || [],
          currentStepIndex: 0,
          planner_raw_output: data.planner_output,
          reflection: data.reflection,
          reliability: data.reliability,
          audit_trail: data.audit_trail,
          patches: data.patches
        };
        set({
          activeWorkflow: replayed,
          activeSurface: 'REPLAY',
          streamLogs: data.audit_trail?.map((a: any) => ({
            timestamp: a.timestamp.split('T')[1].substring(0, 8),
            event_type: a.event_type,
            message: a.message,
            payload: a.payload
          })) || []
        });
      }
    } catch (err) {
      console.error('Failed to load workflow replay:', err);
    }
  },

  approvePlan: async (planId) => {
    try {
      await fetch(`http://localhost:8000/api/v1/modification/approve/${planId}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to approve plan:', err);
    }
  },

  rejectPlan: async (planId) => {
    try {
      await fetch(`http://localhost:8000/api/v1/modification/reject/${planId}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to reject plan:', err);
    }
  },

  triggerWorkspaceIndex: async () => {
    try {
      await fetch('http://localhost:8000/api/v1/context/index', { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger indexing:', err);
    }
  },

  fetchTools: async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/orchestration/tools');
      if (res.ok) {
        const data = await res.json();
        set({ tools: data });
      }
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    }
  },

  fetchPresets: async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/chat/presets');
      if (res.ok) {
        const data = await res.json();
        set({ presets: data });
      }
    } catch (err) {
      console.error('Failed to fetch presets:', err);
    }
  },

  checkHealth: async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      const data = await res.json();
      const payload = res.status === 503 && data.detail ? data.detail : data;
      set({
        healthStatus: {
          status: payload.status || 'degraded',
          dependencies: payload.dependencies || { postgres: 'error', redis: 'error', ollama: 'error' }
        }
      });
    } catch (err) {
      console.error('Failed to check health:', err);
      set({
        healthStatus: {
          status: 'error',
          dependencies: { postgres: 'error', redis: 'error', ollama: 'error' }
        }
      });
    }
  }
}));

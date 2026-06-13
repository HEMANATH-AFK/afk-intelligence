import { create } from 'zustand';
import { Message, SystemEvent, EventType, AgentRole } from '../types/system';

interface OrchestratorState {
  messages: Message[];
  session_id: string;
  isStreaming: boolean;
  activeAgent: AgentRole;
  currentThought: string;
  eventLog: SystemEvent[];
  
  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (status: boolean) => void;
  setActiveAgent: (role: AgentRole) => void;
  setCurrentThought: (thought: string) => void;
  processEvent: (event: SystemEvent) => void;
  reset: () => void;
}

export const useOrchestratorStore = create<OrchestratorState>((set) => ({
  messages: [],
  session_id: `session_${Date.now()}`,
  isStreaming: false,
  activeAgent: AgentRole.ORCHESTRATOR,
  currentThought: '',
  eventLog: [],

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  updateLastMessage: (content) => set((state) => {
    const newMessages = [...state.messages];
    if (newMessages.length > 0) {
      newMessages[newMessages.length - 1].content += content;
    }
    return { messages: newMessages };
  }),

  setStreaming: (status) => set({ isStreaming: status }),
  setActiveAgent: (role) => set({ activeAgent: role }),
  setCurrentThought: (thought) => set({ currentThought: thought }),

  processEvent: (event) => set((state) => {
    const newEventLog = [...state.eventLog, event];
    
    // Logic for updating UI based on event type
    // This will be handled more granularly by specialized stores (Workflow, Execution, etc.)
    
    return { eventLog: newEventLog };
  }),

  reset: () => set({ messages: [], eventLog: [], isStreaming: false })
}));

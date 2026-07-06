import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  messages: [
    { role: 'assistant', content: 'Agent initialized. Advanced orchestration layer active. Awaiting parameters.', events: [] }
  ],
  isTyping: false,
  currentThought: '',
  session_id: 'local_session_1',
  events: [], 
  pendingApproval: null,
  activeWorkflow: null, // { workflow_id, steps, currentStepIndex }

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  updateLastMessage: (updater) => set((state) => {
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      newMessages[newMessages.length - 1] = updater(lastMessage);
    }
    return { messages: newMessages };
  }),

  setTyping: (isTyping) => set({ isTyping }),
  setCurrentThought: (thought) => set({ currentThought: thought }),
  
  addEvent: (event) => set((state) => ({
    events: [...state.events, event]
  })),

  submitApproval: async (approved) => {
    const { pendingApproval } = get();
    if (!pendingApproval) return;
    try {
      await fetch('http://localhost:8000/api/execution/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_id: pendingApproval.approval_id, approved })
      });
      set({ pendingApproval: null });
    } catch (e) { console.error(e); }
  },

  sendMessage: async (userInput) => {
    const { session_id, addMessage, updateLastMessage, setTyping, setCurrentThought, addEvent } = get();
    
    set({ activeWorkflow: null }); // Clear previous workflow
    addMessage({ role: 'user', content: userInput, events: [] });
    setTyping(true);
    setCurrentThought('Initializing connection...');

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, model: 'gemma:2b', session_id })
      });

      if (!response.body) throw new Error('No readable stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      addMessage({ role: 'assistant', content: '', events: [] });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            addEvent(data);

            if (data.event === 'token') {
              updateLastMessage(msg => ({ ...msg, content: msg.content + data.message }));
              setCurrentThought('');
            } else if (data.event === 'telemetry' && data.payload && data.payload.workflow_id) {
              set({ activeWorkflow: { ...data.payload, currentStepIndex: 0 } });
            } else if (data.event === 'system_state') {
              setCurrentThought(data.message);
              // Parse "State: EXECUTE_STEP (1/5)"
              const match = data.message.match(/\((\d+)\//);
              if (match) {
                set(state => ({
                  activeWorkflow: state.activeWorkflow ? { ...state.activeWorkflow, currentStepIndex: parseInt(match[1]) - 1 } : null
                }));
              }
            } else if (data.event === 'tool_call' && data.payload && data.payload.approval_id) {
              set({ pendingApproval: { approval_id: data.payload.approval_id, payload: data.payload } });
            } else if (['thinking', 'tool_call', 'tool_result'].includes(data.event)) {
              setCurrentThought(data.message);
              updateLastMessage(msg => ({ ...msg, events: [...(msg.events || []), data.message] }));
            }
          } catch { updateLastMessage(msg => ({ ...msg, content: msg.content + line })); }
        }
      }
    } catch (error) {
      addMessage({ role: 'assistant', content: `[ERROR]: ${error.message}`, events: [] });
    } finally {
      setTyping(false);
      setCurrentThought('');
    }
  }
}));

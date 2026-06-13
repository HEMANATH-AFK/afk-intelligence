import { create } from 'zustand';
import { Workflow, WorkflowStep } from '../types/system';

interface WorkflowState {
  activeWorkflow: Workflow | null;
  setWorkflow: (workflow: Workflow) => void;
  updateStep: (stepUpdate: Partial<WorkflowStep>) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  activeWorkflow: null,
  setWorkflow: (workflow) => set({ activeWorkflow: workflow }),
  updateStep: (update) => set((state) => {
    if (!state.activeWorkflow) return state;
    const steps = state.activeWorkflow.steps.map(s => 
      s.id === update.id ? { ...s, ...update } : s
    );
    return { activeWorkflow: { ...state.activeWorkflow, steps } };
  })
}));

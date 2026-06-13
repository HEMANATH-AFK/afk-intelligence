import { create } from 'zustand';
import { RiskLevel } from '../types/system';

export interface ApprovalRequest {
  approval_id: string;
  tool: string;
  args: any;
  explanation: {
    objective: string;
    reasoning: string;
    expected_result: string;
  };
  risk: {
    level: RiskLevel;
    reason: string;
  };
}

interface ExecutionState {
  pendingApprovals: ApprovalRequest[];
  executionHistory: any[];
  activeDiff: string | null;
  
  // Actions
  addApprovalRequest: (request: ApprovalRequest) => void;
  removeApprovalRequest: (id: string) => void;
  setDiff: (diff: string | null) => void;
  submitApproval: (id: string, approved: boolean) => Promise<void>;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  pendingApprovals: [],
  executionHistory: [],
  activeDiff: null,

  addApprovalRequest: (request) => set((state) => ({
    pendingApprovals: [...state.pendingApprovals, request]
  })),

  removeApprovalRequest: (id) => set((state) => ({
    pendingApprovals: state.pendingApprovals.filter(r => r.approval_id !== id)
  })),

  setDiff: (diff) => set({ activeDiff: diff }),

  submitApproval: async (id, approved) => {
    try {
      await fetch('http://localhost:8000/api/execution/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_id: id, approved })
      });
      get().removeApprovalRequest(id);
    } catch (error) {
      console.error('Approval submission failed:', error);
    }
  }
}));

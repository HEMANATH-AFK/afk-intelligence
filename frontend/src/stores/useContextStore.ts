import { create } from 'zustand';
import { EvidenceChunk } from '../types/system';

interface ContextState {
  evidence: EvidenceChunk[];
  tokenBudget: {
    used: number;
    total: number;
  };
  
  // Actions
  setEvidence: (evidence: EvidenceChunk[]) => void;
  setTokenBudget: (used: number, total: number) => void;
  clearContext: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
  evidence: [],
  tokenBudget: { used: 0, total: 32000 },

  setEvidence: (evidence) => set({ evidence }),
  
  setTokenBudget: (used, total) => set({ tokenBudget: { used, total } }),
  
  clearContext: () => set({ evidence: [], tokenBudget: { used: 0, total: 32000 } })
}));

import { create } from 'zustand';
import { GraphNode, GraphEdge } from '../types/system';

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  blastRadius: string[]; // List of impacted node IDs
  
  // Actions
  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  selectNode: (id: string | null) => void;
  updateBlastRadius: (impactedIds: string[]) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  blastRadius: [],

  setGraph: (nodes, edges) => set({ nodes, edges }),
  
  selectNode: (id) => set({ selectedNodeId: id }),
  
  updateBlastRadius: (ids) => set({ blastRadius: ids }),
  
  clearGraph: () => set({ nodes: [], edges: [], selectedNodeId: null, blastRadius: [] })
}));

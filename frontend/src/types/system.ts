export enum EventType {
  TOKEN = 'token',
  THINKING = 'thinking',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  SYSTEM_STATE = 'system_state',
  TELEMETRY = 'telemetry',
  WORKFLOW_UPDATE = 'workflow_update',
  SECURITY_ALERT = 'security_alert',
  VERIFICATION_RESULT = 'verification_result',
  GRAPH_UPDATE = 'graph_update',
  CONTEXT_RANKING = 'context_ranking'
}

export enum AgentRole {
  ARCHITECT = 'ARCHITECT',
  CODER = 'CODER',
  TESTER = 'TESTER',
  REVIEWER = 'REVIEWER',
  ORCHESTRATOR = 'ORCHESTRATOR'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface WorkflowStep {
  id: string;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  tool_call?: any;
  result?: any;
  verification?: {
    success: boolean;
    confidence: number;
    analysis: string;
  };
}

export interface Workflow {
  workflow_id: string;
  goal: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
}

export interface GraphNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'module';
  label: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'IMPORTS' | 'CALLS' | 'CONTAINS' | 'DEPENDS_ON';
}

export interface EvidenceChunk {
  content: string;
  source: string;
  relevance: number;
  tier: 'CRITICAL' | 'SUPPORTING' | 'OPTIONAL';
}

export interface TelemetryMetrics {
  ttft: number;
  tokens_per_sec: number;
  latency: number;
  memory_usage: number;
  queue_depth: number;
  active_agent: AgentRole;
}

export interface SystemEvent {
  event: EventType;
  session_id: string;
  message: string;
  payload?: any;
  timestamp: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  events: SystemEvent[];
  agent?: AgentRole;
  workflow_id?: string;
  confidence?: number;
}

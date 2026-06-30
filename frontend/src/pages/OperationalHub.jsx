import React from 'react';
import OperationalShell from '../components/layout/OperationalShell';
import CognitiveChat from '../modules/chat/CognitiveChat';
import TelemetryDashboard from '../modules/telemetry/TelemetryDashboard';
import AuditCenter from '../modules/audit/AuditCenter';
import ApprovalModal from '../components/ApprovalModal';
import { useExecutionStore } from '../stores/useExecutionStore';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import WorkflowTimeline from '../components/WorkflowTimeline';
import { GitBranch, Box, LayoutGrid } from 'lucide-react';
import { HoverMagnetic } from '@hemanath-afk/afk-motion';

export default function OperationalHub() {
  const { pendingApprovals, submitApproval } = useExecutionStore();
  const { activeWorkflow } = useWorkflowStore();

  return (
    <OperationalShell
      leftPanel={<RepositoryPanel />}
      rightPanel={<TelemetryDashboard />}
      bottomPanel={<AuditCenter />}
    >
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Workflow Visualization */}
        {activeWorkflow && (
          <div className="mb-6">
            <WorkflowTimeline 
              steps={activeWorkflow.steps} 
              currentStepIndex={activeWorkflow.currentStepIndex} 
            />
          </div>
        )}

        {/* Chat Runtime */}
        <CognitiveChat />

        {/* Floating Approvals */}
        {pendingApprovals.map((req) => (
          <ApprovalModal
            key={req.approval_id}
            isOpen={true}
            payload={req}
            onApprove={() => submitApproval(req.approval_id, true)}
            onReject={() => submitApproval(req.approval_id, false)}
          />
        ))}
      </div>
    </OperationalShell>
  );
}

function RepositoryPanel() {
  return (
    <div className="p-4 flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <LayoutGrid className="w-4 h-4 text-white/30" />
        <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Cognition Surface</h3>
      </div>
      
      <div className="space-y-4">
        <NavItem icon={<GitBranch className="w-3 h-3" />} label="GRAPH EXPLORER" active />
        <NavItem icon={<Box className="w-3 h-3" />} label="DEPENDENCY MAP" />
      </div>

      <div className="mt-auto p-3 border border-white/5 rounded-lg bg-white/[0.02]">
        <div className="text-[9px] text-white/20 font-mono mb-2 uppercase">Root Workspace</div>
        <div className="text-[10px] text-white/60 font-mono truncate">/Users/AFK/Intelligence</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <HoverMagnetic>
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/40 hover:bg-white/5'
      }`}>
        {icon}
        <span className="text-[10px] font-bold tracking-tighter font-mono">{label}</span>
      </div>
    </HoverMagnetic>
  );
}

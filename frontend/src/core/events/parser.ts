import { SystemEvent, EventType } from '../../types/system';
import { useOrchestratorStore } from '../../stores/useOrchestratorStore';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

export class EventParser {
  static parse(line: string): SystemEvent | null {
    try {
      return JSON.parse(line) as SystemEvent;
    } catch (e) {
      return null;
    }
  }

  static dispatch(event: SystemEvent) {
    const orchestrator = useOrchestratorStore.getState();
    const execution = useExecutionStore.getState();
    const workflow = useWorkflowStore.getState();
    const telemetry = useTelemetryStore.getState();

    // Log event to the global bus
    orchestrator.processEvent(event);

    switch (event.event) {
      case EventType.TOKEN:
        orchestrator.updateLastMessage(event.message);
        break;

      case EventType.THINKING:
      case EventType.SYSTEM_STATE:
        orchestrator.setCurrentThought(event.message);
        break;

      case EventType.TOOL_CALL:
        if (event.payload?.approval_id) {
          execution.addApprovalRequest(event.payload);
        }
        break;

      case EventType.TELEMETRY:
        if (event.payload?.workflow_id) {
          workflow.setWorkflow(event.payload);
        }
        telemetry.updateMetrics(event.payload);
        break;

      case EventType.WORKFLOW_UPDATE:
        workflow.updateStep(event.payload);
        break;

      default:
        console.warn('Unhandled event type:', event.event);
    }
  }
}

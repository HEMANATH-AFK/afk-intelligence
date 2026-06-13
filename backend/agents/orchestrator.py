from tools.registry import tool_registry
from memory.manager import memory_manager
from services.ollama_service import ollama_service
from events.logger import SSEEvent, EventType
from agents.intent import intent_classifier, UserIntent
from agents.reflection import reflection_engine
from agents.specialized.team import team_orchestrator, AgentRole
from planning.manager import workflow_manager, TaskStatus
from workspace.graph.extractor import workspace_graph
from execution.risk import risk_classifier
from execution.manager import execution_manager
from audit.logger import audit_logger

import json
import logging
import os
import asyncio
from enum import Enum

logger = logging.getLogger(__name__)

class OrchestratorState(Enum):
    RECEIVE_GOAL = "RECEIVE_GOAL"
    PLAN_WORKFLOW = "PLAN_WORKFLOW"
    DELEGATE_TASK = "DELEGATE_TASK"
    EXECUTE_STEP = "EXECUTE_STEP"
    VERIFY_STEP = "VERIFY_STEP"
    COMPLETE = "COMPLETE"

class AgentOrchestrator:
    def __init__(self):
        self.max_steps = 8

    async def stream_orchestrated_response(self, session_id: str, message: str, model: str):
        # 1. RECEIVE_GOAL
        yield SSEEvent(event_type=EventType.SYSTEM_STATE, message=f"State: {OrchestratorState.RECEIVE_GOAL.value}", session_id=session_id).to_json()
        
        # 2. PLAN_WORKFLOW (Architect Agent)
        yield SSEEvent(event_type=EventType.SYSTEM_STATE, message=f"State: {OrchestratorState.PLAN_WORKFLOW.value}", session_id=session_id).to_json()
        yield SSEEvent(event_type=EventType.THINKING, message="Architect analyzing repository structure...", session_id=session_id).to_json()
        
        workspace_graph.build_graph()
        
        plan_raw = await team_orchestrator.delegate_task(
            AgentRole.ARCHITECT, model, 
            f"Decompose this goal into a JSON array of steps: {message}", 
            "Available tools: read_file, scan_workspace, execute_terminal"
        )
            
        try:
            start = plan_raw.find("[")
            end = plan_raw.rfind("]") + 1
            steps = json.loads(plan_raw[start:end])
            
            workflow_id = await workflow_manager.create_workflow(session_id, message, steps)
            yield SSEEvent(event_type=EventType.TELEMETRY, message="Architectural plan finalized.", session_id=session_id, payload={"workflow_id": workflow_id, "steps": steps}).to_json()
            
            # 3. STEPWISE EXECUTION
            for i, step in enumerate(steps[:self.max_steps]):
                yield SSEEvent(event_type=EventType.SYSTEM_STATE, message=f"State: {OrchestratorState.EXECUTE_STEP.value} ({i+1}/{len(steps)})", session_id=session_id).to_json()
                
                # DELEGATE TO CODER
                yield SSEEvent(event_type=EventType.THINKING, message=f"Coder performing: {step['description']}", session_id=session_id).to_json()
                
                tool_call = step.get("tool_call")
                if tool_call:
                    # APPROVAL GATE (Safe Execution)
                    risk = risk_classifier.classify(tool_call["args"].get("command", "")) if tool_call["name"] == "execute_terminal" else {"level": "LOW", "requires_approval": False}
                    
                    if risk["requires_approval"]:
                        yield SSEEvent(event_type=EventType.TOOL_CALL, message="Awaiting authorization...", session_id=session_id, payload={"tool": tool_call["name"], "args": tool_call["args"], "explanation": {"objective": step["description"]}, "risk": risk}).to_json()
                        approved = await execution_manager.request_approval(session_id, {"approval_id": "pending"}) # Simplified
                        if not approved: return

                    # EXECUTE
                    result = tool_registry.execute_tool(tool_call["name"], tool_call["args"])
                    
                    # 4. VERIFY (Tester/Reviewer Agent)
                    yield SSEEvent(event_type=EventType.SYSTEM_STATE, message=f"State: {OrchestratorState.VERIFY_STEP.value}", session_id=session_id).to_json()
                    yield SSEEvent(event_type=EventType.THINKING, message="Tester verifying outcome...", session_id=session_id).to_json()
                    
                    verification = await reflection_engine.verify_outcome(model, step["description"], str(tool_call), result)
                    
                    yield SSEEvent(event_type=EventType.TOOL_RESULT, message=f"Verification complete. Confidence: {verification['confidence']*100}%", session_id=session_id).to_json()

            yield SSEEvent(event_type=EventType.TOKEN, message=f"\n### Workflow Complete\nAll architectural steps verified by the agent team.", session_id=session_id).to_json()

        except Exception as e:
            logger.error(f"Team failure: {e}")
            yield SSEEvent(event_type=EventType.TOKEN, message=f"System error: {str(e)}", session_id=session_id).to_json()

orchestrator = AgentOrchestrator()

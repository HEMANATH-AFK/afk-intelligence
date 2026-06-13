import asyncio
import uuid
from typing import Dict, Any, Optional
from execution.risk import risk_classifier
from execution.diff import diff_engine
from execution.snapshots import rollback_manager
from audit.logger import audit_logger

class ExecutionManager:
    def __init__(self):
        self.pending_approvals: Dict[str, asyncio.Future] = {}

    async def request_approval(self, session_id: str, plan: Dict[str, Any]) -> bool:
        """Emits an approval request and waits for a response."""
        approval_id = str(uuid.uuid4())
        future = asyncio.Future()
        self.pending_approvals[approval_id] = future
        
        # This will be picked up by the orchestrator to emit SSE
        plan["approval_id"] = approval_id
        
        try:
            # Wait for user input via submit_approval endpoint
            # Timeout after 5 minutes
            result = await asyncio.wait_for(future, timeout=300.0)
            return result
        except asyncio.TimeoutExpired:
            return False
        finally:
            if approval_id in self.pending_approvals:
                del self.pending_approvals[approval_id]

    def submit_approval(self, approval_id: str, approved: bool):
        """Called by an API endpoint when the user clicks approve/reject."""
        if approval_id in self.pending_approvals:
            self.pending_approvals[approval_id].set_result(approved)
            return True
        return False

    async def execute_with_safety(self, session_id: str, command: str, tool_func):
        """Main entry point for safe execution."""
        # 1. Risk Classification
        risk = risk_classifier.classify(command)
        
        if risk.get("is_blocked"):
            return {"status": "error", "message": f"Execution blocked: {risk['reason']}"}

        # 2. Preparation (Optional snapshots for write commands)
        # For this prototype, we'll assume we know which files to backup or just backup the root
        # In real usage, the LLM would provide 'affected_files'
        
        # 3. Execution (with logic for approval)
        # NOTE: The Orchestrator will handle the actual 'request_approval' call
        # because it needs to yield SSE events.
        
        return risk

execution_manager = ExecutionManager()

from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.orchestration.domain.entities import WorkflowModel
import logging

logger = logging.getLogger(__name__)

class ReliabilityEngine:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def calculate_reliability(self, workflow_id: str) -> dict:
        """
        Evaluate workflow grounding quality, tool execution success rates,
        reflection confidence, and syntax validation runs.
        """
        wf = await self.session.get(WorkflowModel, workflow_id)
        if not wf:
            return {"reliability_score": 0.0, "hallucination_risk": "HIGH", "grounding_quality": "LOW"}
            
        state_data = wf.state_data or {}
        
        # 1. Grounding quality: Did we retrieve documents?
        plan = state_data.get("plan", {})
        has_retrieved_context = "=== RETRIEVED REPOSITORY CONTEXT ===" in state_data.get("request", "") or plan.get("requires_tools", False)
        grounding_score = 0.9 if has_retrieved_context else 0.4
        
        # 2. Tool success rate
        execution_results = state_data.get("execution_results", [])
        tool_success_rate = 1.0
        if execution_results:
            successes = sum(1 for r in execution_results if r.get("status") == "success")
            tool_success_rate = successes / len(execution_results)
            
        # 3. Reflection confidence
        reflection = state_data.get("reflection", {})
        reflection_confidence = reflection.get("confidence", 0.8)
        
        # 4. Failed validations (syntactical issues)
        failed_validations = state_data.get("failed_validations", 0)
        validation_penalty = 0.2 * failed_validations
        
        # Weighted score calculation
        raw_score = (grounding_score * 0.3) + (tool_success_rate * 0.4) + (reflection_confidence * 0.3) - validation_penalty
        reliability_score = max(0.0, min(1.0, raw_score))
        
        hallucination_risk = "LOW"
        if reliability_score < 0.5:
            hallucination_risk = "HIGH"
        elif reliability_score < 0.8:
            hallucination_risk = "MEDIUM"
            
        grounding_quality = "HIGH"
        if grounding_score < 0.5:
            grounding_quality = "LOW"
            
        breakdown = [
            f"Grounding baseline: {grounding_score}",
            f"Tool success rate: {tool_success_rate}",
            f"Reflection confidence: {reflection_confidence}",
            f"Validation penalties applied: {failed_validations}"
        ]
        
        report = {
            "reliability_score": round(reliability_score, 2),
            "hallucination_risk": hallucination_risk,
            "grounding_quality": grounding_quality,
            "confidence_breakdown": breakdown
        }
        
        # Persist report in state_data
        wf.state_data = {**state_data, "reliability": report}
        await self.session.commit()
        
        return report

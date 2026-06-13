import json
from pydantic import BaseModel
from src.shared.ollama_client import generate_completion
from src.shared.redis_pubsub import publish_event

class PatchProposalSchema(BaseModel):
    diff: str
    confidence: float
    risk_notes: list[str]

class PatchProposalEngine:
    def __init__(self, workflow_id: str, model_name: str = "llama3"):
        self.workflow_id = workflow_id
        self.model_name = model_name

    async def propose_patch(self, file_path: str, current_content: str, change_intent: str) -> dict:
        await publish_event(self.workflow_id, "PROPOSING_PATCH", "patch_proposed", f"Generating unified diff proposal for: {file_path}")
        
        system_prompt = f"""You are a Staff Security and Software Engineer. Generate a safe, robust git unified patch/diff to apply a change.
Target File: {file_path}
Intent: {change_intent}

Return strictly valid JSON matching this schema:
{{
    "diff": "unified diff block (+ and - format)",
    "confidence": 0.0 to 1.0,
    "risk_notes": ["risk annotation 1", "risk annotation 2"]
}}
Do NOT output any conversational text or markdown wrappers. Only JSON.
"""

        context = f"Current file content:\n{current_content}"
        
        try:
            raw_response = await generate_completion(
                prompt=f"{system_prompt}\n\n{context}",
                model=self.model_name,
                format="json"
            )
            
            cleaned_response = raw_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
                
            parsed_data = json.loads(cleaned_response)
            validated = PatchProposalSchema(**parsed_data)
            
            return {
                "file": file_path,
                "diff": validated.diff,
                "confidence": validated.confidence,
                "risk_notes": validated.risk_notes
            }
        except Exception as e:
            return {
                "file": file_path,
                "diff": f"Failed to generate patch proposal: {e}",
                "confidence": 0.0,
                "risk_notes": [str(e)]
            }

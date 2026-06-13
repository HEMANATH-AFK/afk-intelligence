import json
from pydantic import BaseModel, Field
from src.shared.ollama_client import generate_completion
from src.shared.redis_pubsub import publish_event

class StepDefinition(BaseModel):
    file: str
    action: str # modify, create, delete (skipped)
    reasoning: str

class ModificationPlanSchema(BaseModel):
    goal: str
    steps: list[StepDefinition] = Field(default_factory=list)
    risk_assessment: str
    required_validations: list[str] = Field(default_factory=list)

class ModificationPlanner:
    def __init__(self, workflow_id: str, model_name: str = "llama3"):
        self.workflow_id = workflow_id
        self.model_name = model_name

    async def generate_plan(self, goal: str, repository_context: str) -> dict:
        await publish_event(self.workflow_id, "PLANNING_MODIFICATION", "modification_plan_generated", "Generating safe repository modification steps...")
        
        system_prompt = """You are a Modification Planner. Analyze the user request and codebase context to formulate a structural change list.
Output strictly valid JSON matching this schema:
{
    "goal": "summarized technical target",
    "steps": [
        {
            "file": "path/to/file.py",
            "action": "modify|create",
            "reasoning": "why this file needs to be modified/created"
        }
    ],
    "risk_assessment": "blast radius explanation",
    "required_validations": ["syntax check", "unit testing required"]
}
Do NOT attempt to write patches yet. Return only JSON.
"""

        context = f"Goal: {goal}\n\nCodebase Context:\n{repository_context}"
        
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
            validated = ModificationPlanSchema(**parsed_data)
            return validated.model_dump()
        except Exception as e:
            return {
                "goal": goal,
                "steps": [],
                "risk_assessment": f"Failed to parse modification plan: {e}",
                "required_validations": ["manual inspection needed"]
            }

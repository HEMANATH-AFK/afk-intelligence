import json
from typing import List, Any
from pydantic import BaseModel, Field, ValidationError
from src.shared.ollama_client import generate_completion

class ReflectionOutput(BaseModel):
    success: bool
    confidence: float
    missing_information: List[str] = Field(default_factory=list)
    final_response: str

class ReflectionAgent:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    async def reflect(self, original_request: str, planner_goal: str, execution_results: list[dict[str, Any]]) -> ReflectionOutput:
        
        system_prompt = """You are a Reflection Agent. Your job is to review the user's original request, the planned goal, and the raw outputs of the tools executed by the Executor Agent.
Determine if the goal was successfully achieved. If tools failed or returned empty outputs, acknowledge the failure and list what is missing.
Format your final response clearly for the user. Do not invent information.

You MUST respond in strictly valid JSON matching this schema:
{
    "success": boolean,
    "confidence": float (0.0 to 1.0),
    "missing_information": ["list", "of", "missing", "data", "if any"],
    "final_response": "The detailed answer to the user's request, referencing tool outputs."
}
Do NOT wrap the JSON in markdown blocks. Return only raw JSON.
"""

        context = f"""
Original Request: {original_request}
Planned Goal: {planner_goal}
Execution Results: {json.dumps(execution_results, indent=2)}
"""
        
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
            return ReflectionOutput(**parsed_data)
            
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"Reflection failed to generate valid JSON: {e}")
            return ReflectionOutput(
                success=False,
                confidence=0.0,
                missing_information=["Failed to parse reflection model output"],
                final_response="An error occurred during the final reflection synthesis phase."
            )

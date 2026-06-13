import json
from typing import List, Optional
from pydantic import BaseModel, Field, ValidationError
from src.shared.ollama_client import generate_completion
from src.modules.tools.registry import registry

class TaskDefinition(BaseModel):
    id: str
    type: str
    reasoning: str
    args: dict

class PlannerOutput(BaseModel):
    goal: str
    requires_tools: bool
    tasks: List[TaskDefinition] = Field(default_factory=list)

class PlannerAgent:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    async def plan(self, user_message: str) -> PlannerOutput:
        tool_schemas = registry.get_tool_schemas()
        
        system_prompt = f"""You are a Planner Agent. Your job is to analyze a user request and determine the exact tasks required to fulfill it.
You have access to the following tools: {json.dumps(tool_schemas)}

You MUST respond in strictly valid JSON matching this schema:
{{
    "goal": "string describing the overall goal",
    "requires_tools": boolean,
    "tasks": [
        {{
            "id": "task_1",
            "type": "tool_name",
            "reasoning": "why this tool is used",
            "args": {{"arg_name": "arg_value"}}
        }}
    ]
}}
Do NOT wrap the JSON in markdown blocks (like ```json). Just return the raw JSON object.
If no tools are required to answer the prompt, set requires_tools to false and leave tasks empty.
"""

        prompt = f"User Request: {user_message}"
        
        try:
            # We enforce JSON mode in ollama_client
            raw_response = await generate_completion(
                prompt=f"{system_prompt}\n\n{prompt}", 
                model=self.model_name,
                format="json"
            )
            
            # Ollama sometimes wraps in markdown anyway or adds trailing text
            cleaned_response = raw_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
                
            parsed_data = json.loads(cleaned_response)
            validated_output = PlannerOutput(**parsed_data)
            return validated_output
            
        except (json.JSONDecodeError, ValidationError) as e:
            # Simple fallback for MVP: Create a reflection-only plan
            print(f"Planner failed to generate valid JSON: {e}")
            print(f"Raw response was: {raw_response}")
            return PlannerOutput(
                goal="Could not parse planner intent, defaulting to reflection.",
                requires_tools=False,
                tasks=[]
            )

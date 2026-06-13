from typing import Dict, Any
from services.ollama_service import ollama_service
import json

class ReflectionEngine:
    def __init__(self):
        self.prompt_template = """You are a critical verification agent. 
Analyze the last action taken and its result. 

[ACTION TAKEN]
{action}

[RESULT OUTPUT]
{result}

Objective: {objective}

Evaluate the outcome:
1. Did the action succeed?
2. Did it achieve the specific goal?
3. Are there new errors or regressions?
4. What is the confidence score (0.0-1.0)?

Output ONLY JSON:
{{
  "success": bool,
  "confidence": float,
  "analysis": "...",
  "requires_remediation": bool,
  "next_suggestion": "..."
}}
"""

    async def verify_outcome(self, model: str, objective: str, action: str, result: str) -> Dict[str, Any]:
        prompt = self.prompt_template.format(
            objective=objective,
            action=action,
            result=result
        )
        
        response = ""
        async for chunk in ollama_service.stream_chat(model, prompt):
            response += chunk
            
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            return json.loads(response[start:end])
        except:
            return {"success": False, "confidence": 0.0, "analysis": "Failed to parse verification."}

reflection_engine = ReflectionEngine()

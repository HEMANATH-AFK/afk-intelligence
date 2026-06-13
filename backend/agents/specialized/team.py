from enum import Enum
from typing import Dict, Any
from services.ollama_service import ollama_service

class AgentRole(str, Enum):
    ARCHITECT = "ARCHITECT"
    CODER = "CODER"
    REVIEWER = "REVIEWER"
    TESTER = "TESTER"

AGENT_PROMPTS = {
    AgentRole.ARCHITECT: """You are the Lead Architect. 
Your goal is to design system structures, identify dependencies, and ensure modularity.
Prioritize structural integrity and separation of concerns.""",
    
    AgentRole.CODER: """You are a Senior Software Engineer.
Your goal is to write clean, efficient, and well-documented code.
Follow project conventions and prioritize readability.""",
    
    AgentRole.REVIEWER: """You are a Code Reviewer.
Your goal is to identify bugs, security vulnerabilities, and code smells.
Be critical and suggest specific improvements.""",
    
    AgentRole.TESTER: """You are a QA Automation Engineer.
Your goal is to ensure 100% test coverage and verify system behavior.
Write edge-case tests and identify regressions."""
}

class TeamOrchestrator:
    def __init__(self):
        pass

    async def delegate_task(self, role: AgentRole, model: str, task_description: str, context: str) -> str:
        system_prompt = AGENT_PROMPTS.get(role)
        full_prompt = f"{system_prompt}\n\n[CONTEXT]\n{context}\n\n[TASK]\n{task_description}\n\nResponse:"
        
        response = ""
        async for chunk in ollama_service.stream_chat(model, full_prompt):
            response += chunk
            
        return response

team_orchestrator = TeamOrchestrator()

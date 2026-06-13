from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.context.domain.entities import GraphNodeModel
from src.shared.redis_pubsub import publish_event

class ArchitectureAnalyzer:
    def __init__(self, session: AsyncSession, workflow_id: str = "system_arch"):
        self.session = session
        self.workflow_id = workflow_id
        
    async def infer_architecture(self) -> dict:
        await publish_event(self.workflow_id, "ARCH_INFERENCE", "architecture_inferred", "Inferring architectural boundaries...")
        
        # Heuristics based on node types and names
        stmt = select(GraphNodeModel)
        nodes = (await self.session.execute(stmt)).scalars().all()
        
        entry_points = [n.name for n in nodes if n.type == "endpoint"]
        core_modules = set()
        models = [n.name for n in nodes if n.type == "class" and "Model" in n.name]
        
        for n in nodes:
            if n.type == "file":
                parts = n.name.split("/")
                if len(parts) > 2:
                    core_modules.add(parts[1]) # Very naive top-level module extraction
                    
        architecture_report = {
            "architecture_style": "Modular Monolith (Inferred)",
            "entry_points": entry_points,
            "core_modules": list(core_modules),
            "models": models
        }
        
        await publish_event(self.workflow_id, "ARCH_INFERENCE", "architecture_inferred", "Architecture inference complete.", payload=architecture_report)
        return architecture_report

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.context.domain.entities import GraphNodeModel, GraphEdgeModel
from src.shared.redis_pubsub import publish_event
import logging

logger = logging.getLogger(__name__)

class ImpactAnalysisService:
    def __init__(self, session: AsyncSession, workflow_id: str):
        self.session = session
        self.workflow_id = workflow_id
        
    async def analyze_impact(self, filepath: str, target_symbol: str = None) -> dict:
        await publish_event(self.workflow_id, "ANALYZING_IMPACT", "impact_analysis_started", f"Starting blast-radius impact analysis on: {filepath}")
        
        # 1. Fetch the file node from the graph
        stmt = select(GraphNodeModel).where(GraphNodeModel.name == filepath)
        result = await self.session.execute(stmt)
        file_node = result.scalar_one_or_none()
        
        if not file_node:
            await publish_event(self.workflow_id, "ANALYZING_IMPACT", "warning", f"File {filepath} not found in dependency graph.")
            return {"affected_files": [], "risk_level": "LOW", "reasoning": ["File not present in index."]}
            
        affected_files = {filepath}
        reasoning = [f"Initial point of change: {filepath}"]
        
        # 2. Trace downstream import chains (finding edges where target_node imports this file)
        # For MVP, search files importing this file or module
        # In a real environment, this traverses graph edges recursively.
        # Let's perform a simple BFS traverse for imports
        queue = [file_node.id]
        visited = set()
        
        while queue:
            current_id = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)
            
            # Find edges where source/target represents an import relation
            edge_stmt = select(GraphEdgeModel).where(
                (GraphEdgeModel.target_node_id == current_id) & 
                (GraphEdgeModel.relationship == "imports")
            )
            edges = (await self.session.execute(edge_stmt)).scalars().all()
            
            for edge in edges:
                # Get the node that imports this one
                node_stmt = select(GraphNodeModel).where(GraphNodeModel.id == edge.source_node_id)
                importing_node = (await self.session.execute(node_stmt)).scalar_one_or_none()
                if importing_node and importing_node.type == "file":
                    affected_files.add(importing_node.name)
                    await publish_event(self.workflow_id, "ANALYZING_IMPACT", "dependency_chain_discovered", f"Downstream impact detected in: {importing_node.name}")
                    queue.append(importing_node.id)
                    
        # Determine risk level based on blast radius
        blast_radius = len(affected_files)
        risk_level = "LOW"
        if blast_radius > 5:
            risk_level = "HIGH"
        elif blast_radius > 2:
            risk_level = "MEDIUM"
            
        reasoning.append(f"Blast radius: {blast_radius} file(s) potentially impacted.")
        
        impact_report = {
            "affected_files": list(affected_files),
            "risk_level": risk_level,
            "reasoning": reasoning
        }
        
        return impact_report

from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.context.services.retrieval import RetrievalEngine
from src.modules.context.services.architecture import ArchitectureAnalyzer
from src.shared.redis_pubsub import publish_event
import json

class ContextAssembler:
    def __init__(self, session: AsyncSession, workflow_id: str):
        self.session = session
        self.workflow_id = workflow_id
        
    async def assemble_context(self, query: str, top_k: int = 5) -> str:
        # 1. Semantic Retrieval
        retrieval = RetrievalEngine(self.session, self.workflow_id)
        semantic_context = await retrieval.search(query, top_k)
        
        # 2. Structural Retrieval
        analyzer = ArchitectureAnalyzer(self.session, self.workflow_id)
        arch_data = await analyzer.infer_architecture()
        
        # Merge
        assembled = f"""
=== ARCHITECTURE OVERVIEW ===
{json.dumps(arch_data, indent=2)}
=============================

=== SEMANTIC EVIDENCE ===
{semantic_context}
=========================
"""
        await publish_event(self.workflow_id, "RETRIEVING", "hybrid_retrieval_completed", "Assembled hybrid structural and semantic context.")
        return assembled

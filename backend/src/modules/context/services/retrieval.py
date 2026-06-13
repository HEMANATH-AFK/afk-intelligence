from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.modules.context.domain.entities import DocumentChunkModel, FileMetadataModel
from src.shared.ollama_client import get_embeddings
from src.shared.redis_pubsub import publish_event
import logging

logger = logging.getLogger(__name__)

class RetrievalEngine:
    def __init__(self, session: AsyncSession, workflow_id: str):
        self.session = session
        self.workflow_id = workflow_id
        
    async def search(self, query: str, top_k: int = 5) -> str:
        await publish_event(self.workflow_id, "RETRIEVING", "retrieval_started", f"Generating query embedding for: '{query}'")
        
        try:
            query_vector = await get_embeddings(query)
            
            # Using cosine distance (embedding.cosine_distance)
            # Order by smallest distance (most similar)
            stmt = select(DocumentChunkModel, FileMetadataModel.path)\
                .join(FileMetadataModel, DocumentChunkModel.file_id == FileMetadataModel.id)\
                .order_by(DocumentChunkModel.embedding.cosine_distance(query_vector))\
                .limit(top_k)
                
            result = await self.session.execute(stmt)
            rows = result.all()
            
            if not rows:
                await publish_event(self.workflow_id, "RETRIEVING", "retrieval_completed", "No context found.")
                return "No relevant context found in the workspace."
                
            context_blocks = []
            for chunk, path in rows:
                await publish_event(
                    self.workflow_id, 
                    "RETRIEVING", 
                    "context_selected", 
                    f"Retrieved chunk from {path} (Lines {chunk.start_line}-{chunk.end_line})",
                    payload={"path": path, "tokens": chunk.token_estimate}
                )
                
                block = f"--- FILE: {path} (Lines {chunk.start_line}-{chunk.end_line}) ---\n{chunk.content}\n"
                context_blocks.append(block)
                
            assembled_context = "\n".join(context_blocks)
            await publish_event(self.workflow_id, "RETRIEVING", "retrieval_completed", "Context assembled successfully.")
            return assembled_context
            
        except Exception as e:
            logger.error(f"Semantic search failed: {e}", exc_info=True)
            await publish_event(self.workflow_id, "RETRIEVING", "retrieval_failed", f"Search failed: {e}")
            return f"Error retrieving context: {e}"

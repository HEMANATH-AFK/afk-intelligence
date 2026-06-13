from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from src.modules.context.domain.entities import FileMetadataModel, DocumentChunkModel
from src.modules.context.services.indexer import WorkspaceIndexer, chunk_text
from src.shared.ollama_client import get_embeddings
from src.shared.redis_pubsub import publish_event
import logging

logger = logging.getLogger(__name__)

class EmbeddingPipeline:
    def __init__(self, session: AsyncSession, workflow_id: str = "system_indexer"):
        self.session = session
        self.workflow_id = workflow_id

    async def run_indexing(self):
        await publish_event(self.workflow_id, "INDEXING", "indexing_started", "Starting workspace semantic indexing...")
        
        scanned_files = WorkspaceIndexer.scan_workspace()
        
        for file_data in scanned_files:
            # Check if file already exists and hasn't changed
            stmt = select(FileMetadataModel).where(FileMetadataModel.path == file_data["path"])
            result = await self.session.execute(stmt)
            existing_file = result.scalar_one_or_none()
            
            if existing_file:
                if existing_file.content_hash == file_data["content_hash"]:
                    continue # Skip unchanged files
                
                # If changed, delete old chunks
                await self.session.execute(delete(DocumentChunkModel).where(DocumentChunkModel.file_id == existing_file.id))
                file_meta = existing_file
            else:
                file_meta = FileMetadataModel(
                    path=file_data["path"],
                    extension=file_data["extension"],
                    size_bytes=file_data["size_bytes"]
                )
                self.session.add(file_meta)
                await self.session.flush() # Get ID
            
            file_meta.content_hash = file_data["content_hash"]
            file_meta.status = "INDEXING"
            await self.session.commit()
            
            # Chunk and embed
            chunks = chunk_text(file_data["content"])
            for i, chunk in enumerate(chunks):
                try:
                    await publish_event(self.workflow_id, "INDEXING", "chunk_created", f"Chunking {file_data['path']} ({i+1}/{len(chunks)})")
                    vector = await get_embeddings(chunk["content"])
                    
                    doc_chunk = DocumentChunkModel(
                        file_id=file_meta.id,
                        content=chunk["content"],
                        start_line=chunk["start_line"],
                        end_line=chunk["end_line"],
                        token_estimate=chunk["token_estimate"],
                        embedding=vector
                    )
                    self.session.add(doc_chunk)
                    await publish_event(self.workflow_id, "INDEXING", "embedding_generated", f"Generated embedding for {file_data['path']} chunk {i+1}")
                except Exception as e:
                    logger.error(f"Failed to embed chunk in {file_data['path']}: {e}")
                    file_meta.status = "FAILED"
                    await self.session.commit()
                    break
            else:
                file_meta.status = "INDEXED"
                await self.session.commit()
                
        await publish_event(self.workflow_id, "INDEXING", "indexing_completed", "Workspace indexing completed.")
        
        # Build structural repository dependency graph
        from src.modules.context.services.graph_service import RepositoryGraphService
        graph_service = RepositoryGraphService(self.session, self.workflow_id)
        await graph_service.build_graph()

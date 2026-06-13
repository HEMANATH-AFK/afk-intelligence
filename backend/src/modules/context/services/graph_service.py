import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from src.modules.context.domain.entities import FileMetadataModel, GraphNodeModel, GraphEdgeModel
from src.modules.context.services.parsers.python_parser import PythonASTParser
from src.shared.redis_pubsub import publish_event

logger = logging.getLogger(__name__)

class RepositoryGraphService:
    def __init__(self, session: AsyncSession, workflow_id: str = "system_graph"):
        self.session = session
        self.workflow_id = workflow_id
        
    async def build_graph(self):
        await publish_event(self.workflow_id, "GRAPH_BUILDING", "graph_build_started", "Starting structural repository parsing...")
        
        # Clear existing graph
        await self.session.execute(delete(GraphEdgeModel))
        await self.session.execute(delete(GraphNodeModel))
        
        # Fetch all indexed files
        stmt = select(FileMetadataModel)
        files = (await self.session.execute(stmt)).scalars().all()
        
        for file_meta in files:
            # 1. Create File Node
            file_node = GraphNodeModel(
                name=file_meta.path,
                type="file",
                file_id=file_meta.id,
                metadata_json={"extension": file_meta.extension}
            )
            self.session.add(file_node)
            await self.session.flush() # get id
            
            await publish_event(self.workflow_id, "GRAPH_BUILDING", "graph_node_discovered", f"Discovered file node: {file_node.name}")
            
            # 2. Parse language specific structures
            if file_meta.extension == ".py":
                # Need to read content from chunks or re-read file
                from src.modules.context.domain.entities import DocumentChunkModel
                chunks_stmt = select(DocumentChunkModel).where(DocumentChunkModel.file_id == file_meta.id).order_by(DocumentChunkModel.start_line)
                chunks = (await self.session.execute(chunks_stmt)).scalars().all()
                content = "\n".join([c.content for c in chunks]) # crude re-assembly for parsing
                
                parsed_ast = PythonASTParser.parse(content, file_meta.path)
                
                # Create nodes for classes
                for cls in parsed_ast["classes"]:
                    cls_node = GraphNodeModel(name=cls["name"], type="class", file_id=file_meta.id, metadata_json=cls)
                    self.session.add(cls_node)
                    await self.session.flush()
                    # Edge: file -> owns -> class
                    self.session.add(GraphEdgeModel(source_node_id=file_node.id, target_node_id=cls_node.id, relationship="owns"))
                    
                # Create nodes for functions
                for fn in parsed_ast["functions"]:
                    # Basic heuristic: if it has router decorators, it's an endpoint
                    node_type = "endpoint" if any(dec in ["get", "post", "put", "delete"] for dec in fn["decorators"]) else "function"
                    
                    fn_node = GraphNodeModel(name=fn["name"], type=node_type, file_id=file_meta.id, metadata_json=fn)
                    self.session.add(fn_node)
                    await self.session.flush()
                    # Edge: file -> owns -> function
                    self.session.add(GraphEdgeModel(source_node_id=file_node.id, target_node_id=fn_node.id, relationship="owns"))

                # Edges for imports (requires a second pass to link actual nodes, skipping for MVP)
                for imp in parsed_ast["imports"]:
                    await publish_event(self.workflow_id, "GRAPH_BUILDING", "dependency_detected", f"{file_node.name} imports {imp['name']}")
                    
        await self.session.commit()
        await publish_event(self.workflow_id, "GRAPH_BUILDING", "graph_build_completed", "Repository graph completed.")

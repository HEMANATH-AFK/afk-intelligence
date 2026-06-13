from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
import uuid
import datetime
from src.core.database import Base

class FileMetadataModel(Base):
    __tablename__ = "file_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    path = Column(String, unique=True, index=True, nullable=False)
    extension = Column(String)
    size_bytes = Column(Integer)
    content_hash = Column(String)
    status = Column(String, default="PENDING") # PENDING, INDEXING, INDEXED, FAILED
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class DocumentChunkModel(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("file_metadata.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    start_line = Column(Integer)
    end_line = Column(Integer)
    token_estimate = Column(Integer)
    # nomic-embed-text generates 768-dimensional embeddings by default
    embedding = Column(Vector(768)) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class GraphNodeModel(Base):
    __tablename__ = "graph_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False) # file, class, function, endpoint, service, model
    file_id = Column(UUID(as_uuid=True), ForeignKey("file_metadata.id", ondelete="CASCADE"))
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class GraphEdgeModel(Base):
    __tablename__ = "graph_edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_node_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id", ondelete="CASCADE"))
    target_node_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id", ondelete="CASCADE"))
    relationship = Column(String, nullable=False) # imports, calls, extends, references, owns, depends_on
    weight = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


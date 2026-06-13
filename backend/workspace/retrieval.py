import uuid
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    import chromadb
    HAS_CHROMA = True
except ImportError:
    HAS_CHROMA = False
    logger.warning("ChromaDB is not installed. Semantic retrieval will operate in mocked fallback mode.")

class SemanticRetrievalPipeline:
    def __init__(self, persist_directory: str = "./.chroma_db"):
        self.persist_directory = persist_directory
        self.collection_name = "workspace_code"
        self.client = None
        self.collection = None
        
        global HAS_CHROMA
        if HAS_CHROMA:
            try:
                self.client = chromadb.PersistentClient(path=self.persist_directory)
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            except Exception as e:
                logger.error(f"Failed to initialize ChromaDB: {e}")
                HAS_CHROMA = False

    def store_chunks(self, chunks: List[Dict[str, Any]]):
        if not HAS_CHROMA or not self.collection:
            logger.info(f"[MOCK] Storing {len(chunks)} chunks in semantic storage.")
            return

        documents = []
        metadatas = []
        ids = []

        for idx, chunk in enumerate(chunks):
            documents.append(chunk["content"])
            metadatas.append({
                "source_file": chunk["file_path"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"]
            })
            ids.append(str(uuid.uuid4()))

        # In production, we'd batch these
        if documents:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

    def retrieve(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        if not HAS_CHROMA or not self.collection:
            logger.info(f"[MOCK] Retrieving results for query: {query}")
            return [{"content": "[MOCK] Retrieved content matching query.", "metadata": {"source_file": "mock.py"}}]

        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        formatted_results = []
        if results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            for doc, meta in zip(docs, metas):
                formatted_results.append({
                    "content": doc,
                    "metadata": meta
                })
        
        return formatted_results

retrieval_pipeline = SemanticRetrievalPipeline()

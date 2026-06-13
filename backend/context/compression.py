import re
from typing import List, Dict, Any

class ContextCompressor:
    def __init__(self):
        self.max_lines_per_chunk = 30

    def compress_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Compresses and filters chunks to maximize token efficiency."""
        compressed = []
        seen_content = set()

        for chunk in chunks:
            content = chunk.get("content", "")
            
            # 1. Deduplication
            content_hash = hash(content.strip())
            if content_hash in seen_content:
                continue
            seen_content.add(content_hash)

            # 2. Structural Priority: Strip excessive comments/whitespace
            lines = content.splitlines()
            cleaned_lines = []
            for line in lines:
                # Remove purely comment lines if the chunk is getting too big
                if len(lines) > self.max_lines_per_chunk and line.strip().startswith(('#', '//')):
                    continue
                cleaned_lines.append(line)
            
            # 3. Truncate very large chunks
            if len(cleaned_lines) > self.max_lines_per_chunk:
                cleaned_lines = cleaned_lines[:self.max_lines_per_chunk]
                cleaned_lines.append("... [Chunk truncated for brevity]")

            source = chunk.get("metadata", {}).get("source_file", "unknown")
            compressed.append(f"FILE: {source}\n" + "\n".join(cleaned_lines))

        return compressed

    def generate_evidence_ranking(self, query: str, compressed_chunks: List[str]) -> Dict[str, List[str]]:
        """Ranks evidence into Critical, Supporting, and Optional."""
        query_terms = set(re.findall(r'\w+', query.lower()))
        
        critical = []
        supporting = []
        optional = []

        for chunk in compressed_chunks:
            chunk_lower = chunk.lower()
            # If chunk contains multiple query terms, it's critical
            matches = sum(1 for term in query_terms if term in chunk_lower)
            
            if matches >= 3:
                critical.append(chunk)
            elif matches >= 1:
                supporting.append(chunk)
            else:
                optional.append(chunk)

        return {
            "CRITICAL": critical,
            "SUPPORTING": supporting,
            "OPTIONAL": optional
        }

context_compressor = ContextCompressor()

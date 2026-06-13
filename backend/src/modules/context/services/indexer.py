import os
import hashlib
from pathlib import Path
from typing import List, Dict, Any
from src.modules.tools.registry import WORKSPACE_ROOT

IGNORED_DIRS = {
    "node_modules", ".git", "dist", "build", ".next", 
    "__pycache__", "venv", ".venv", "coverage", ".idea", ".vscode"
}
IGNORED_EXTENSIONS = {
    ".pyc", ".png", ".jpg", ".jpeg", ".gif", ".ico", 
    ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mov"
}
MAX_FILE_SIZE = 1024 * 1024 # 1 MB

def get_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def chunk_text(content: str, max_chunk_lines: int = 100, overlap_lines: int = 20) -> List[Dict[str, Any]]:
    """
    Naïve line-based chunking with overlap. 
    Can be upgraded to AST-aware chunking later.
    """
    lines = content.split('\n')
    chunks = []
    
    start = 0
    while start < len(lines):
        end = min(start + max_chunk_lines, len(lines))
        chunk_content = "\n".join(lines[start:end])
        
        chunks.append({
            "content": chunk_content,
            "start_line": start + 1,
            "end_line": end,
            # Rough token estimate (words * 1.3)
            "token_estimate": int(len(chunk_content.split()) * 1.3)
        })
        
        if end == len(lines):
            break
        start += (max_chunk_lines - overlap_lines)
        
    return chunks

class WorkspaceIndexer:
    @staticmethod
    def scan_workspace() -> List[Dict[str, Any]]:
        scanned_files = []
        
        for root, dirs, files in os.walk(WORKSPACE_ROOT):
            # Mutate dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
            
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in IGNORED_EXTENSIONS or file == ".env":
                    continue
                    
                filepath = Path(root) / file
                try:
                    size = filepath.stat().st_size
                    if size > MAX_FILE_SIZE:
                        continue
                        
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    rel_path = str(filepath.relative_to(WORKSPACE_ROOT))
                    
                    scanned_files.append({
                        "path": rel_path,
                        "extension": ext,
                        "size_bytes": size,
                        "content_hash": get_content_hash(content),
                        "content": content
                    })
                except Exception as e:
                    print(f"Failed to scan {filepath}: {e}")
                    
        return scanned_files

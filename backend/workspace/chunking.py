import ast
from typing import List, Dict, Any
from pathlib import Path

class CodeChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.ignore_dirs = ['.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build']
        self.supported_extensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css']

    def chunk_directory(self, root_path: str) -> List[Dict[str, Any]]:
        all_chunks = []
        root = Path(root_path)
        
        for file_path in root.rglob('*'):
            if any(part in self.ignore_dirs for part in file_path.parts):
                continue
            
            if file_path.is_file() and file_path.suffix in self.supported_extensions:
                if file_path.suffix == '.py':
                    all_chunks.extend(self.chunk_python_file(file_path))
                else:
                    all_chunks.extend(self.chunk_generic_file(file_path))
                
        return all_chunks

    def chunk_python_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """AST-aware chunking for Python files."""
        chunks = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            for node in tree.body:
                if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.AsyncFunctionDef)):
                    start_line = node.lineno
                    end_line = getattr(node, 'end_lineno', start_line + 5) # Fallback for older python
                    
                    chunk_content = "\n".join(content.splitlines()[start_line-1:end_line])
                    
                    chunks.append({
                        "file_path": str(file_path.absolute()),
                        "content": chunk_content,
                        "start_line": start_line,
                        "end_line": end_line,
                        "type": "class" if isinstance(node, ast.ClassDef) else "function",
                        "name": node.name
                    })
            
            # If no classes/functions found or file is small, fallback to generic
            if not chunks:
                return self.chunk_generic_file(file_path)
                
        except Exception:
            return self.chunk_generic_file(file_path)
            
        return chunks

    def chunk_generic_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Fallback line-based chunking with overlap."""
        chunks = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if not content:
                return []
            
            lines = content.splitlines()
            total_lines = len(lines)
            
            # Simple line-based chunking (approx 50 lines per chunk)
            lines_per_chunk = 50
            overlap_lines = 10
            
            start = 0
            while start < total_lines:
                end = min(start + lines_per_chunk, total_lines)
                chunk_content = "\n".join(lines[start:end])
                
                chunks.append({
                    "file_path": str(file_path.absolute()),
                    "content": chunk_content,
                    "start_line": start + 1,
                    "end_line": end,
                    "type": "generic"
                })
                
                if end == total_lines:
                    break
                    
                start += (lines_per_chunk - overlap_lines)
                
        except Exception:
            pass
            
        return chunks

code_chunker = CodeChunker()

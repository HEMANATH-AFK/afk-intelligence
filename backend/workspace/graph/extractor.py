import ast
import os
import networkx as nx
from pathlib import Path
from typing import Optional

class GraphExtractor:
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root).absolute()
        self.graph = nx.DiGraph()

    def build_graph(self):
        """Walks the workspace and extracts nodes and edges."""
        for root, dirs, files in os.walk(self.workspace_root):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'venv', '__pycache__']]
            
            for file in files:
                if file.endswith('.py'):
                    file_path = Path(root) / file
                    self._process_python_file(file_path)

    def _process_python_file(self, file_path: Path):
        rel_path = str(file_path.relative_to(self.workspace_root))
        
        # 1. Add File Node
        self.graph.add_node(rel_path, type='file', path=str(file_path))

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                # 2. Add Class/Function Nodes
                if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                    node_id = f"{rel_path}::{node.name}"
                    node_type = 'class' if isinstance(node, ast.ClassDef) else 'function'
                    docstring = ast.get_docstring(node) or ""
                    sloc = 0
                    if hasattr(node, "end_lineno") and node.end_lineno is not None:
                        sloc = node.end_lineno - node.lineno + 1
                    
                    param_count = 0
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        param_count += len(node.args.args)
                        if hasattr(node.args, "posonlyargs") and node.args.posonlyargs:
                            param_count += len(node.args.posonlyargs)
                        if node.args.kwonlyargs:
                            param_count += len(node.args.kwonlyargs)
                        if node.args.vararg:
                            param_count += 1
                        if node.args.kwarg:
                            param_count += 1
                    
                    self.graph.add_node(node_id, 
                                       type=node_type, 
                                       name=node.name, 
                                       file=rel_path,
                                       lineno=node.lineno,
                                       docstring=docstring,
                                       sloc=sloc,
                                       param_count=param_count)
                    
                    # Edge: File CONTAINS Class/Function
                    self.graph.add_edge(rel_path, node_id, relationship='contains')

                    # Parse base classes for class inheritance relations
                    if isinstance(node, ast.ClassDef):
                        for base in node.bases:
                            base_name = None
                            if isinstance(base, ast.Name):
                                base_name = base.id
                            elif isinstance(base, ast.Attribute) and isinstance(base.value, ast.Name):
                                base_name = f"{base.value.id}.{base.attr}"
                            
                            if base_name:
                                self.graph.add_edge(node_id, base_name, relationship='inherits')

                # 3. Add Import Edges
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        self.graph.add_edge(rel_path, alias.name, relationship='imports')
                
                if isinstance(node, ast.ImportFrom):
                    module = node.module or ""
                    self.graph.add_edge(rel_path, module, relationship='imports_from')

                # 4. Add Function Calls (Rough approximation via AST)
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        # Local or global call in same file context
                        self.graph.add_edge(rel_path, node.func.id, relationship='calls')
                    elif isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
                        # Module.function call
                        self.graph.add_edge(rel_path, f"{node.func.value.id}.{node.func.attr}", relationship='calls')

        except Exception:
            # Skip unparseable files
            pass

    def get_neighbors(self, node_id: str, relationship: Optional[str] = None):
        """Returns neighbors of a node, optionally filtered by relationship."""
        neighbors = []
        for neighbor in self.graph.neighbors(node_id):
            if relationship:
                if self.graph.get_edge_data(node_id, neighbor).get('relationship') == relationship:
                    neighbors.append(neighbor)
            else:
                neighbors.append(neighbor)
        return neighbors

    def get_summary(self):
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges(),
            "types": nx.get_node_attributes(self.graph, 'type')
        }

# Singleton for current workspace
# In multi-tenant, we'd manage this per-project
workspace_graph = GraphExtractor(os.getcwd())

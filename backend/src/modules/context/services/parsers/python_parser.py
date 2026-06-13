import ast
from typing import List, Dict, Any

class PythonASTParser:
    @staticmethod
    def parse(file_content: str, filepath: str) -> Dict[str, Any]:
        """
        Parses python source code and extracts structural metadata.
        Returns imports, classes, functions, and decorators.
        """
        try:
            tree = ast.parse(file_content)
        except SyntaxError:
            return {"imports": [], "classes": [], "functions": []}
            
        imports = []
        classes = []
        functions = []
        
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append({"name": alias.name, "type": "import"})
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    imports.append({"name": f"{module}.{alias.name}", "type": "import_from"})
            elif isinstance(node, ast.ClassDef):
                bases = [b.id for b in node.bases if isinstance(b, ast.Name)]
                classes.append({
                    "name": node.name,
                    "extends": bases,
                    "line": node.lineno
                })
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                decorators = []
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Name):
                        decorators.append(dec.id)
                    elif isinstance(dec, ast.Call) and isinstance(dec.func, ast.Name):
                        decorators.append(dec.func.id)
                    elif isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                        decorators.append(dec.func.attr)
                        
                functions.append({
                    "name": node.name,
                    "decorators": decorators,
                    "line": node.lineno
                })
                
        return {
            "imports": imports,
            "classes": classes,
            "functions": functions
        }

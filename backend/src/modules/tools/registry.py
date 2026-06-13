import os
from typing import Callable, Dict, Any
from pydantic import BaseModel
from pathlib import Path

class ToolConfig(BaseModel):
    name: str
    description: str
    is_safe: bool = True

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, tuple[ToolConfig, Callable]] = {}

    def register(self, config: ToolConfig, func: Callable):
        self._tools[config.name] = (config, func)

    def get_tool_schemas(self) -> list[dict]:
        return [{"name": c.name, "description": c.description} for c, _ in self._tools.values()]

    async def execute(self, name: str, **kwargs) -> Any:
        if name not in self._tools:
            return {"error": f"Tool {name} not registered or not allowlisted."}
        
        config, func = self._tools[name]
        try:
            return await func(**kwargs)
        except Exception as e:
            return {"error": str(e)}

registry = ToolRegistry()

# Safety function
WORKSPACE_ROOT = Path("/app").resolve() if os.path.exists("/app") else Path(os.getcwd()).resolve()

def _ensure_safe_path(filepath: str) -> Path:
    target = (WORKSPACE_ROOT / filepath).resolve()
    if not str(target).startswith(str(WORKSPACE_ROOT)):
        raise PermissionError(f"Path traversal detected: {filepath}")
    return target

async def read_file(path: str) -> str:
    try:
        safe_path = _ensure_safe_path(path)
        with open(safe_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error: {e}"

async def list_directory(path: str = ".") -> str:
    try:
        safe_path = _ensure_safe_path(path)
        if not safe_path.is_dir():
            return f"Error: {path} is not a directory."
        items = os.listdir(safe_path)
        return "\n".join(items)
    except Exception as e:
        return f"Error: {e}"

async def search_workspace(pattern: str) -> str:
    try:
        # Simplified grep via glob matching for the MVP
        matches = []
        for filepath in WORKSPACE_ROOT.rglob(pattern):
            if filepath.is_file():
                matches.append(str(filepath.relative_to(WORKSPACE_ROOT)))
        return "\n".join(matches) if matches else "No matches found."
    except Exception as e:
        return f"Error: {e}"

registry.register(
    ToolConfig(name="read_file", description="Reads the contents of a local file safely. Args: {'path': 'string'}"),
    read_file
)
registry.register(
    ToolConfig(name="list_directory", description="Lists the files in a directory. Args: {'path': 'string'}"),
    list_directory
)
registry.register(
    ToolConfig(name="search_workspace", description="Searches the workspace for files matching a glob pattern (e.g. '*.py'). Args: {'pattern': 'string'}"),
    search_workspace
)

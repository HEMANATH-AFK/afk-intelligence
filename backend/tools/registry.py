import json
from typing import Callable, Dict, Any, Type, Optional
from pydantic import BaseModel, ValidationError

class ToolDefinition(BaseModel):
    name: str
    description: str
    schema_model: Type[BaseModel]

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._definitions: Dict[str, ToolDefinition] = {}

    def register(self, name: str, description: str, schema: Type[BaseModel]):
        def decorator(func: Callable):
            self._tools[name] = func
            self._definitions[name] = ToolDefinition(
                name=name,
                description=description,
                schema_model=schema
            )
            return func
        return decorator

    def get_tool(self, name: str) -> Optional[Callable]:
        return self._tools.get(name)

    def get_definition(self, name: str) -> Optional[ToolDefinition]:
        return self._definitions.get(name)

    def get_all_schemas(self) -> Dict[str, Any]:
        schemas = {}
        for name, definition in self._definitions.items():
            schemas[name] = {
                "description": definition.description,
                "parameters": definition.schema_model.schema()
            }
        return schemas

    def execute_tool(self, name: str, raw_args: dict) -> str:
        definition = self._definitions.get(name)
        tool_func = self._tools.get(name)
        
        if not definition or not tool_func:
            return json.dumps({"error": f"Unknown tool: {name}"})

        try:
            # Pydantic schema validation
            validated_args = definition.schema_model(**raw_args)
            
            # Execute tool safely
            result = tool_func(**validated_args.dict())
            return json.dumps({"status": "success", "result": result})
            
        except ValidationError as e:
            return json.dumps({"error": "Schema validation failed", "details": e.errors()})
        except Exception as e:
            return json.dumps({"error": "Execution failed", "details": str(e)})

tool_registry = ToolRegistry()

# ----------------- Base Tool Schemas -----------------

class ReadFileSchema(BaseModel):
    path: str

class ScanWorkspaceSchema(BaseModel):
    path: str

class ExecuteTerminalSchema(BaseModel):
    command: str

# ----------------- Tool Implementations -----------------

@tool_registry.register("read_file", "Reads the content of a file given its absolute path.", ReadFileSchema)
def read_file(path: str) -> str:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise RuntimeError(f"Error reading file {path}: {str(e)}")

@tool_registry.register("scan_workspace", "Scans a directory and returns its structure and technologies.", ScanWorkspaceSchema)
def scan_workspace(path: str) -> str:
    from workspace.scanner import workspace_scanner
    try:
        result = workspace_scanner.analyze_project(path)
        return str(result)
    except Exception as e:
        raise RuntimeError(f"Error scanning workspace {path}: {str(e)}")

@tool_registry.register("execute_terminal", "Executes a command in the system terminal (sandboxed).", ExecuteTerminalSchema)
def execute_terminal(command: str) -> str:
    from tools.terminal import terminal_sandbox
    return terminal_sandbox.execute(command)

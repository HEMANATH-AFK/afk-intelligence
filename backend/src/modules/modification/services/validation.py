import py_compile
import logging
from pathlib import Path
from src.modules.tools.registry import WORKSPACE_ROOT
from src.shared.redis_pubsub import publish_event

logger = logging.getLogger(__name__)

class ValidationExecutor:
    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        
    def _verify_and_resolve(self, filepath: str) -> Path:
        target = (WORKSPACE_ROOT / filepath).resolve()
        if not str(target).startswith(str(WORKSPACE_ROOT)):
            raise PermissionError(f"Escaping workspace context: {filepath}")
        return target

    async def validate_syntax(self, filepath: str) -> dict:
        """
        Runs a highly safe, AST-based compilation check on the modified python file.
        No shell execution.
        """
        await publish_event(self.workflow_id, "VALIDATING", "validation_started", f"Starting safe AST compilation syntax check on: {filepath}")
        
        try:
            target_path = self._verify_and_resolve(filepath)
            
            if target_path.suffix == ".py":
                # Compiles code directly into bytecode safely without running it.
                py_compile.compile(str(target_path), doraise=True)
                
                await publish_event(self.workflow_id, "VALIDATING", "validation_success", f"Syntax validation passed: {filepath}")
                return {"filepath": filepath, "status": "passed"}
            else:
                # Basic non-python success
                await publish_event(self.workflow_id, "VALIDATING", "validation_success", f"File validation skipped (Non-python content): {filepath}")
                return {"filepath": filepath, "status": "skipped"}
                
        except py_compile.PyCompileError as e:
            logger.warning(f"Syntax validation failed: {e}")
            await publish_event(self.workflow_id, "VALIDATING", "validation_failed", f"Syntax error discovered: {e}")
            return {"filepath": filepath, "status": "failed", "error": str(e)}
        except Exception as e:
            await publish_event(self.workflow_id, "VALIDATING", "validation_failed", f"Validation exception: {e}")
            return {"filepath": filepath, "status": "failed", "error": str(e)}

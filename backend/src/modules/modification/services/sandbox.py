import shutil
import datetime
from pathlib import Path
from src.modules.tools.registry import WORKSPACE_ROOT
from src.shared.redis_pubsub import publish_event
import logging

logger = logging.getLogger(__name__)

class SafeWriteSandbox:
    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        # Backup store inside workspace scratch directory
        self.backup_dir = WORKSPACE_ROOT / ".gemini" / "backups" / workflow_id
        
    def _verify_and_resolve(self, filepath: str) -> Path:
        target = (WORKSPACE_ROOT / filepath).resolve()
        if not str(target).startswith(str(WORKSPACE_ROOT)):
            raise PermissionError(f"Permission Denied: Path escapes workspace context: {filepath}")
        return target

    async def apply_safe_write(self, filepath: str, new_content: str) -> dict:
        """
        Creates a timestamped backup copy in a hidden directory and updates the file safely.
        """
        await publish_event(self.workflow_id, "EXECUTING_WRITE", "rollback_snapshot_created", f"Generating rollback backup before writing: {filepath}")
        
        try:
            target_path = self._verify_and_resolve(filepath)
            
            # 1. Create rollback backup
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            backup_file_path = self.backup_dir / f"{target_path.name}.bak_{int(datetime.datetime.utcnow().timestamp())}"
            
            if target_path.exists():
                shutil.copy2(target_path, backup_file_path)
                logger.info(f"Rollback backup generated at: {backup_file_path}")
            else:
                logger.info(f"Target file {filepath} is new. No backup generated.")
                
            # 2. Write new content safely
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
            await publish_event(self.workflow_id, "EXECUTING_WRITE", "write_success", f"Successfully applied safe write to: {filepath}")
            
            return {
                "filepath": filepath,
                "status": "success",
                "backup_path": str(backup_file_path.relative_to(WORKSPACE_ROOT)) if target_path.exists() else None
            }
            
        except Exception as e:
            logger.error(f"Sandbox write failed for {filepath}: {e}", exc_info=True)
            await publish_event(self.workflow_id, "EXECUTING_WRITE", "write_failed", f"Safe write failed: {e}")
            return {
                "filepath": filepath,
                "status": "failed",
                "error": str(e)
            }
            
    async def rollback(self, filepath: str, backup_rel_path: str):
        """
        Restores a backup copy.
        """
        try:
            target_path = self._verify_and_resolve(filepath)
            backup_path = self._verify_and_resolve(backup_rel_path)
            
            if backup_path.exists():
                shutil.copy2(backup_path, target_path)
                logger.info(f"Successfully rolled back {filepath} using {backup_rel_path}")
                await publish_event(self.workflow_id, "ROLLBACK", "rollback_success", f"Restored {filepath} from snapshot backup.")
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            await publish_event(self.workflow_id, "ROLLBACK", "rollback_failed", f"Rollback restoration failed: {e}")

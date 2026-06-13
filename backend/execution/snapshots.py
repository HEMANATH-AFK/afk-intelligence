import os
import shutil
from pathlib import Path
from datetime import datetime

class RollbackManager:
    def __init__(self, workspace_root: str):
        self.backup_dir = Path(workspace_root) / ".afk_backups"

    def create_snapshot(self, session_id: str, file_paths: list) -> str:
        """Creates a timestamped backup of the specified files."""
        snapshot_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_dir = self.backup_dir / session_id / snapshot_id
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for path in file_paths:
            if os.path.exists(path) and os.path.isfile(path):
                dest = target_dir / os.path.basename(path)
                shutil.copy2(path, dest)
        
        return snapshot_id

    def rollback(self, session_id: str, snapshot_id: str):
        """Restores files from a specific snapshot."""
        source_dir = self.backup_dir / session_id / snapshot_id
        if not source_dir.exists():
            return False
            
        for backup_file in source_dir.iterdir():
            # This is a simple version, assumes files are in root for now
            # Future version would preserve directory structure
            dest = Path(os.getcwd()) / backup_file.name
            shutil.copy2(backup_file, dest)
        
        return True

rollback_manager = RollbackManager(os.getcwd())

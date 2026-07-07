import os
import shutil
from pathlib import Path
from datetime import datetime

class RollbackManager:
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root).absolute()
        self.backup_dir = self.workspace_root / ".afk_backups"

    def create_snapshot(self, session_id: str, file_paths: list) -> str:
        """Creates a timestamped backup of the specified files, preserving subdirectory structures."""
        snapshot_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_dir = self.backup_dir / session_id / snapshot_id
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for path in file_paths:
            abs_path = Path(path).absolute()
            if abs_path.exists() and abs_path.is_file():
                try:
                    rel_path = abs_path.relative_to(self.workspace_root)
                    dest = target_dir / rel_path
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(abs_path, dest)
                except ValueError:
                    # If path is not relative to workspace_root, copy it to target_dir root
                    dest = target_dir / abs_path.name
                    shutil.copy2(abs_path, dest)
        
        return snapshot_id

    def rollback(self, session_id: str, snapshot_id: str):
        """Restores files from a specific snapshot, preserving subdirectory structures."""
        source_dir = self.backup_dir / session_id / snapshot_id
        if not source_dir.exists():
            return False
            
        for root, _, files in os.walk(source_dir):
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(source_dir)
                dest = self.workspace_root / rel_path
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file_path, dest)
        
        return True

rollback_manager = RollbackManager(os.getcwd())

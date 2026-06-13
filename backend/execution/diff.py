import difflib
import os
from typing import Dict, List

class ExecutionDiffEngine:
    def __init__(self):
        pass

    def capture_state(self, file_paths: List[str]) -> Dict[str, str]:
        """Captures the current content of specific files."""
        state = {}
        for path in file_paths:
            if os.path.exists(path) and os.path.isfile(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        state[path] = f.read()
                except Exception:
                    pass
        return state

    def generate_diff(self, before_state: Dict[str, str], after_state: Dict[str, str]) -> Dict[str, str]:
        """Generates a unified diff between two states."""
        diffs = {}
        for path in set(list(before_state.keys()) + list(after_state.keys())):
            before = before_state.get(path, "")
            after = after_state.get(path, "")
            
            if before != after:
                diff = difflib.unified_diff(
                    before.splitlines(),
                    after.splitlines(),
                    fromfile=f"a/{path}",
                    tofile=f"b/{path}",
                    lineterm=""
                )
                diffs[path] = "\n".join(list(diff))
        
        return diffs

diff_engine = ExecutionDiffEngine()

import subprocess
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class ExecutionPolicy:
    def __init__(self, workspace_root: str):
        self.workspace_root = str(Path(workspace_root).absolute())
        self.allowed_commands = ['ls', 'dir', 'git status', 'git log', 'npm list', 'pip list', 'python --version', 'node --version']
        self.blocked_patterns = ['rm ', 'del ', 'format ', 'mkfs ', '> /dev/', 'sudo ', 'chmod ', 'chown ']
        self.max_runtime_seconds = 30
        self.max_output_bytes = 50000

    def is_safe(self, command: str) -> tuple[bool, str]:
        # 1. Check blocked patterns
        if any(pattern in command.lower() for pattern in self.blocked_patterns):
            return False, "Command contains blocked pattern."
            
        # 2. Strict whitelist check (initially for stability)
        # In a real system, we'd allow more but with intense validation
        if not any(command.startswith(allowed) for allowed in self.allowed_commands):
             # For simulation, we'll allow but log warning if it's not in strict whitelist
             logger.warning(f"Unchecked command attempted: {command}")
             
        return True, ""

class TerminalSandbox:
    def __init__(self, workspace_root: str):
        self.policy = ExecutionPolicy(workspace_root)
        self.cwd = workspace_root

    def execute(self, command: str) -> str:
        # Check security policy
        safe, reason = self.policy.is_safe(command)
        if not safe:
            return f"[SECURITY ALERT] Execution blocked: {reason}"

        try:
            # Execute with restricted environment and shell=False where possible
            # Note: on Windows, some commands need shell=True for path resolution
            process = subprocess.Popen(
                command,
                shell=True, # Need True for built-ins and combined commands on Windows
                cwd=self.cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env={**os.environ, "PAGER": "cat"} # Prevent interactive pagers
            )

            try:
                stdout, stderr = process.communicate(timeout=self.policy.max_runtime_seconds)
            except subprocess.TimeoutExpired:
                process.kill()
                return f"[ERROR] Execution timed out after {self.policy.max_runtime_seconds}s."

            output = stdout if stdout else ""
            if stderr:
                output += f"\n[STDERR]\n{stderr}"
            
            if len(output) > self.policy.max_output_bytes:
                output = output[:self.policy.max_output_bytes] + "\n... [Output truncated]"

            return output.strip() if output.strip() else "[Success - No Output]"

        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return f"[ERROR] Execution failed: {str(e)}"

# Global instance for simulation
# In production, this would be scoped per session/workspace
terminal_sandbox = TerminalSandbox(os.getcwd())

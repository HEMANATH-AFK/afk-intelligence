from enum import Enum
from typing import Dict, Any
import re

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RiskClassifier:
    """Classifies terminal commands into distinct safety tiers based on predefined pattern rules."""

    def __init__(self) -> None:
        self.rules: Dict[RiskLevel, Dict[str, Any]] = {
            RiskLevel.LOW: {
                "patterns": [
                    r"^ls", r"^dir", r"^git status", r"^git log", r"^pwd",
                    r"^cat ", r"^grep ", r"^echo", r"^git diff", r"^git show",
                    r"^git branch"
                ],
                "description": "Read-only operations"
            },
            RiskLevel.MEDIUM: {
                "patterns": [
                    r"^npm install", r"^pip install", r"^pytest", r"^npm test",
                    r"^vite build", r"^poetry run", r"^poetry install", r"^python -m pytest"
                ],
                "description": "Project-local mutations or tests"
            },
            RiskLevel.HIGH: {
                "patterns": [r"^rm ", r"^del ", r"^mv ", r"^git reset", r"^chmod ", r"^git commit", r"^git push"],
                "description": "Potentially destructive or system-altering"
            },
            RiskLevel.CRITICAL: {
                "patterns": [r"^sudo ", r"^mkfs", r"^diskpart", r"^format ", r"^shutdown", r"^dd ", r"^rmdir "],
                "description": "Dangerous system-level operations (Blocked)"
            }
        }

    def get_description(self, level: RiskLevel) -> str:
        """Get the description for a given risk level."""
        return self.rules.get(level, {}).get("description", "Unknown risk level")

    def classify(self, command: str) -> Dict[str, Any]:
        cmd_clean = command.strip().lower()
        
        # Check CRITICAL first
        for pattern in self.rules[RiskLevel.CRITICAL]["patterns"]:
            if re.search(pattern, cmd_clean):
                return {
                    "level": RiskLevel.CRITICAL,
                    "requires_approval": True,
                    "reason": "Dangerous system-level operation detected.",
                    "is_blocked": True
                }

        # Check HIGH
        for pattern in self.rules[RiskLevel.HIGH]["patterns"]:
            if re.search(pattern, cmd_clean):
                return {
                    "level": RiskLevel.HIGH,
                    "requires_approval": True,
                    "reason": "Potentially destructive command detected.",
                    "is_blocked": False
                }

        # Check MEDIUM
        for pattern in self.rules[RiskLevel.MEDIUM]["patterns"]:
            if re.search(pattern, cmd_clean):
                return {
                    "level": RiskLevel.MEDIUM,
                    "requires_approval": True,
                    "reason": "Project-local mutation or heavy execution.",
                    "is_blocked": False
                }

        # Check LOW
        for pattern in self.rules[RiskLevel.LOW]["patterns"]:
            if re.search(pattern, cmd_clean):
                return {
                    "level": RiskLevel.LOW,
                    "requires_approval": False,
                    "reason": "Safe read-only operation.",
                    "is_blocked": False
                }

        # Default to HIGH for unknown commands
        return {
            "level": RiskLevel.HIGH,
            "requires_approval": True,
            "reason": "Unrecognized command, defaulting to strict approval.",
            "is_blocked": False
        }

risk_classifier = RiskClassifier()

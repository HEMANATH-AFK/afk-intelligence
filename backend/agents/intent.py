from enum import Enum
import logging

logger = logging.getLogger(__name__)

class UserIntent(str, Enum):
    ARCHITECTURE_ANALYSIS = "ARCHITECTURE_ANALYSIS"
    BUG_DIAGNOSIS = "BUG_DIAGNOSIS"
    REFACTORING = "REFACTORING"
    SECURITY_REVIEW = "SECURITY_REVIEW"
    PERFORMANCE_ANALYSIS = "PERFORMANCE_ANALYSIS"
    DEPENDENCY_TRACE = "DEPENDENCY_TRACE"
    STATE_FLOW = "STATE_FLOW"
    TERMINAL_EXECUTION = "TERMINAL_EXECUTION"
    GENERIC_CHAT = "GENERIC_CHAT"

class IntentClassifier:
    def __init__(self):
        self.intent_keywords = {
            UserIntent.ARCHITECTURE_ANALYSIS: ["architecture", "structure", "design", "how is it built", "organize"],
            UserIntent.BUG_DIAGNOSIS: ["bug", "fail", "error", "not working", "fix", "issue", "crash", "wrong"],
            UserIntent.REFACTORING: ["refactor", "clean", "improve", "rewrite", "simplify", "modularize"],
            UserIntent.SECURITY_REVIEW: ["security", "vulnerability", "auth", "token", "jwt", "leak", "protect"],
            UserIntent.PERFORMANCE_ANALYSIS: ["slow", "performance", "fast", "bottleneck", "optimization", "latency"],
            UserIntent.DEPENDENCY_TRACE: ["depends", "import", "call", "caller", "dependency", "module"],
            UserIntent.STATE_FLOW: ["state", "prop", "flow", "context", "store", "redux", "zustand", "data"],
            UserIntent.TERMINAL_EXECUTION: ["run", "execute", "terminal", "command", "shell", "npm", "pip", "git"]
        }

    def classify(self, message: str) -> UserIntent:
        message_lower = message.lower()
        
        # Simple keyword-based classification
        # In production, this would be a specialized fast-inference model call
        for intent, keywords in self.intent_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                logger.info(f"Classified intent: {intent}")
                return intent
        
        return UserIntent.GENERIC_CHAT

intent_classifier = IntentClassifier()

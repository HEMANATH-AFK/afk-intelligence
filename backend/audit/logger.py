import json
import logging
from datetime import datetime
from typing import Dict, Any
from database.mongodb import db_client

logger = logging.getLogger(__name__)

class AuditLogger:
    def __init__(self):
        self.collection_name = "audit_logs"

    async def log_execution(self, session_id: str, data: Dict[str, Any]):
        """Persists a complete execution audit trail to MongoDB."""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id,
            **data
        }
        
        try:
            if db_client.db is not None:
                await db_client.db[self.collection_name].insert_one(audit_entry)
            else:
                # Fallback to local file if Mongo is down
                with open("audit_fallback.log", "a") as f:
                    f.write(json.dumps(audit_entry) + "\n")
        except Exception as e:
            logger.error(f"Audit logging failed: {e}")

audit_logger = AuditLogger()

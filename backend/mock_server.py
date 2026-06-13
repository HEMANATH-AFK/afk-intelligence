import http.server
import socketserver
import json
import time
import uuid

PORT = 8000

class MockHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/v1/chat/workflows/') and self.path.endswith('/stream'):
            # This is our GET /api/v1/chat/workflows/{workflow_id}/stream endpoint!
            # SSE streams must return text/event-stream
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()

            workflow_id = self.path.split('/')[-2]
            
            # Yield named event types
            events = [
                {"event": "system_state", "message": "STAGE: PENDING", "state": "PENDING"},
                {"event": "token", "message": "### COGNITIVE ANALYSIS INITIATED\n\n", "payload": {}},
                {"event": "token", "message": "Refactored named SSE event-stream transport initialized.\n\n", "payload": {}},
                
                {"event": "system_state", "message": "STAGE: RETRIEVING", "state": "RETRIEVING"},
                {"event": "context_assembled", "message": "Repository context assembled and injected into prompt.", "payload": {}},
                
                {"event": "system_state", "message": "STAGE: PLANNING", "state": "PLANNING"},
                {"event": "planning_started", "message": "Analyzing request and retrieved context...", "payload": {}},
                {"event": "planner_raw_output", "message": "Planner generated tasks", "payload": {
                    "goal": "Introduce secure JWT refresh tokens and database schemas",
                    "requires_tools": True,
                    "tasks": [
                        {"id": "t1", "type": "scan", "description": "Identify authentication file location"},
                        {"id": "t2", "type": "modify", "description": "Extend database model to persist tokens"},
                        {"id": "t3", "type": "modify", "description": "Create authorization endpoints"}
                    ]
                }},
                {"event": "telemetry", "message": "Workflow Plan", "payload": {
                    "workflow_id": workflow_id,
                    "steps": [
                        {"id": "t1", "description": "Identify authentication file location", "status": "PENDING"},
                        {"id": "t2", "description": "Extend database model to persist tokens", "status": "PENDING"},
                        {"id": "t3", "description": "Create authorization endpoints", "status": "PENDING"}
                    ]
                }},
                
                {"event": "system_state", "message": "STAGE: EXECUTING", "state": "EXECUTING"},
                {"event": "tool_execution_started", "message": "Running step 1", "payload": {"id": "t1"}},
                {"event": "tool_execution_completed", "message": "Step 1 complete", "payload": {"task_id": "t1", "status": "success", "result": "Found auth logic in src/modules/auth/service.py"}},
                
                {"event": "tool_execution_started", "message": "Running step 2", "payload": {"id": "t2"}},
                {"event": "tool_execution_completed", "message": "Step 2 complete", "payload": {"task_id": "t2", "status": "success", "result": "Added RefreshToken schema to database.py"}},
                
                {"event": "tool_execution_started", "message": "Running step 3", "payload": {"id": "t3"}},
                {"event": "tool_execution_completed", "message": "Step 3 complete", "payload": {"task_id": "t3", "status": "success", "result": "Exposed POST /refresh in presentation.py"}},
                
                {"event": "system_state", "message": "STAGE: REFLECTING", "state": "REFLECTING"},
                {"event": "reflection_completed", "message": "Reflection complete.", "payload": {
                    "success": True,
                    "final_response": "Successfully added JWT refresh tokens with secure backup and compiler checks."
                }},
                {"event": "token", "message": "**Final Response:**\nSuccessfully added JWT refresh tokens with secure backup and compiler checks.\n\n", "payload": {}},
                
                {"event": "reliability_calculated", "message": "Reliability calculated.", "payload": {
                    "reliability_score": 0.94,
                    "hallucination_risk": "LOW",
                    "grounding_quality": "HIGH",
                    "confidence_breakdown": [
                        "AST graph lookup matched 3/3 target symbols",
                        "Vector similarity index scored 0.92 grounding matching main auth module",
                        "Bytecode py_compile compilation pass: 100% SUCCESS"
                    ]
                }},
                
                {"event": "system_state", "message": "STAGE: STORE_MEMORY", "state": "STORE_MEMORY"},
                {"event": "workflow_completed", "message": "Workflow completed", "payload": {"workflow_id": workflow_id, "status": "COMPLETED"}}
            ]
            
            for evt in events:
                # Proper SSE format: event: <name>\ndata: <json>\n\n
                self.wfile.write(f"event: {evt.get('event', 'info')}\n".encode('utf-8'))
                self.wfile.write(f"data: {json.dumps(evt)}\n\n".encode('utf-8'))
                self.wfile.flush()
                time.sleep(0.3)

        elif self.path.startswith('/api/v1/orchestration/workflow/') and self.path.endswith('/replay'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            # Mock Workflow Replay
            workflow_id = self.path.split('/')[-2]
            replay_payload = {
                "workflow_id": workflow_id,
                "status": "COMPLETED",
                "request": "Add JWT refresh token support to the auth backend.",
                "planner_output": {
                    "goal": "Introduce secure JWT refresh tokens and database schemas",
                    "requires_tools": True,
                    "tasks": [
                        {"id": "t1", "type": "scan", "description": "Identify authentication file location"},
                        {"id": "t2", "type": "modify", "description": "Extend database model to persist tokens"},
                        {"id": "t3", "type": "modify", "description": "Create authorization endpoints"}
                    ]
                },
                "execution_results": [
                    {"task_id": "t1", "status": "success", "result": "Found auth logic in src/modules/auth/service.py"},
                    {"task_id": "t2", "status": "success", "result": "Added RefreshToken schema to database.py"},
                    {"task_id": "t3", "status": "success", "result": "Exposed POST /refresh in presentation.py"}
                ],
                "reflection": {
                    "success": True,
                    "final_response": "Successfully added JWT refresh tokens with secure backup and compiler checks."
                },
                "reliability": {
                    "reliability_score": 0.94,
                    "hallucination_risk": "LOW",
                    "grounding_quality": "HIGH",
                    "confidence_breakdown": [
                        "AST graph lookup matched 3/3 target symbols",
                        "Vector similarity index scored 0.92 grounding matching main auth module",
                        "Bytecode py_compile compilation pass: 100% SUCCESS"
                    ]
                },
                "patches": [
                    {
                        "filepath": "backend/src/core/database.py",
                        "diff": """@@ -24,3 +24,10 @@
 class RefreshToken(Base):
+    __tablename__ = 'refresh_tokens'
+    id = Column(UUID(as_uuid=True), primary_key=True)
+    token = Column(String, unique=True)
+    user_id = Column(UUID, ForeignKey('users.id'))""",
                        "confidence": {"score": 0.95, "risk_notes": ["Requires migration execution to populate refresh_tokens table"]}
                    }
                ],
                "audit_trail": [
                    {"event_type": "state_transition", "message": "Transitioned to: PLANNING", "timestamp": "2026-05-17T23:45:00"},
                    {"event_type": "impact_analysis_started", "message": "Analyzing modification blast radius...", "timestamp": "2026-05-17T23:45:04"},
                    {"event_type": "patch_proposed", "message": "Patch generated for core/database.py", "timestamp": "2026-05-17T23:45:10"},
                    {"event_type": "rollback_snapshot_created", "message": "Rollback snapshot backup generated.", "timestamp": "2026-05-17T23:45:12"}
                ]
            }
            self.wfile.write(json.dumps(replay_payload).encode('utf-8'))
            
        elif self.path.startswith('/api/v1/orchestration/session/') and self.path.endswith('/history'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            session_id = self.path.split('/')[-2]
            history_payload = {
                "session_id": session_id,
                "prompt_history": ["Add JWT refresh tokens", "Create user model schemas"],
                "summaries": {
                    "intent_summary": "Extending authentication schemas to introduce robust token rotation strategies."
                },
                "created_at": "2026-05-17T23:40:00"
            }
            self.wfile.write(json.dumps(history_payload).encode('utf-8'))
        else:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))

    def do_POST(self):
        # Enable CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            req = json.loads(post_data)
        except:
            req = {}

        if self.path == '/api/v1/chat/workflows':
            # This is our new workflow creation endpoint!
            workflow_id = str(uuid.uuid4())
            response_payload = {
                "workflow_id": workflow_id,
                "status": "PENDING"
            }
            self.wfile.write(json.dumps(response_payload).encode('utf-8'))
        else:
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))

with socketserver.TCPServer(("", PORT), MockHandler) as httpd:
    print("Serving Supreme Mock Runtime at port", PORT)
    httpd.serve_forever()

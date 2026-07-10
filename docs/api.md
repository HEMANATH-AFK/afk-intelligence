# API Route References

This document lists the core FastAPI HTTP API endpoints available in the AFK-Intelligence backend.

## 1. Chat API (`api/chat.py`)

Handles downstream multi-agent execution goals.

* **POST `/api/chat/`**
  * **Payload Schema:**
    ```json
    {
      "message": "Write a python calculator script",
      "model": "gemma:2b",
      "session_id": "optional-uuid"
    }
    ```
  * **Returns:** A real-time `StreamingResponse` (SSE/Server-Sent Events) transmitting system state shifts, coder updates, and agent outputs to the client.

---

## 2. Workspace Management (`api/workspace.py`)

Handles codebase indexing, scanners, directory checks.

* **GET `/api/workspace/files`**: List active indexed directory structures.
* **POST `/api/workspace/index`**: Force the scanner to re-parse the directory files.

---

## 3. Auth API (`api/auth.py`)

Provides local session authentication and user validation.

* **POST `/api/auth/login`**: Authenticate using username & password credentials.
* **POST `/api/auth/register`**: Registers a new local operator account.

---

## 4. Execution API (`api/execution.py`)

Connects human-in-the-loop validation checkpoints.

* **POST `/api/execution/approve/{approval_id}`**: Signals that the user has authorized a pending command.
* **POST `/api/execution/reject/{approval_id}`**: Rejects/aborts a pending agent command.


### Validation: Chat Input Constraints
All chat requests sent to `/api/chat/` must validate against the Pydantic schema requiring a non-empty `message` string and a valid model identifier.

### API: Stream Event Serialization format
SSE stream events follow the format `data: {"event": "event_type", "message": "text", "payload": {}}`. Clients should parse each text line as JSON if prefix matching occurs.

### API: Workspace Scan Endpoint
The `/api/workspace/scan` endpoint returns details on detected programming technologies, recursive file metrics, and standard configuration files found in root.
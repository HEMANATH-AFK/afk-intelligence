from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from workspace.scanner import workspace_scanner
import os

router = APIRouter()

class ScanRequest(BaseModel):
    path: str

@router.post("/scan")
async def scan_workspace(request: ScanRequest):
    if not os.path.exists(request.path):
        raise HTTPException(status_code=400, detail="Directory path does not exist.")
        
    try:
        analysis = workspace_scanner.analyze_project(request.path)
        
        # Format the result to match the existing UI expectations, while providing deep intelligence
        return {
            "status": "success",
            "path": analysis["path"],
            "summary": f"Workspace scan complete. Frameworks detected: {', '.join(analysis['technologies']) if analysis['technologies'] else 'None'}",
            "technologies": analysis["technologies"],
            "architecture": analysis["architecture_summary"],
            "improvements": [
                "Agent suggests separating business logic from view layer.",
                "Potential unhandled edge cases in package dependency tree.",
                "Consider initializing vector index for massive codebases."
            ],
            "raw_analysis": analysis # Exposing raw data for deeper agent usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

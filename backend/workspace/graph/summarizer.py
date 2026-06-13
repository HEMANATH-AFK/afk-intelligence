from workspace.graph.extractor import workspace_graph
import networkx as nx

class ArchitectureSummarizer:
    def __init__(self):
        self.graph = workspace_graph.graph

    def summarize(self) -> str:
        """Generates a structural summary of the workspace."""
        if self.graph.number_of_nodes() == 0:
            return "Workspace graph is empty. Initialize scan to build architecture map."

        nodes = self.graph.nodes(data=True)
        files = [n for n, d in nodes if d.get('type') == 'file']
        classes = [n for n, d in nodes if d.get('type') == 'class']
        functions = [n for n, d in nodes if d.get('type') == 'function']

        # Identify 'Hubs' (files with most imports/dependencies)
        in_degrees = dict(self.graph.in_degree())
        top_hubs = sorted(in_degrees.items(), key=lambda x: x[1], reverse=True)[:5]
        
        hub_summary = "\n".join([f"- {h[0]} ({h[1]} dependents)" for h in top_hubs])

        summary = f"""
[ARCHITECTURE SUMMARY]
Total Files: {len(files)}
Total Classes: {len(classes)}
Total Functions: {len(functions)}

Core System Hubs:
{hub_summary}

Structure detected: {self._infer_frameworks(files)}
"""
        return summary.strip()

    def _infer_frameworks(self, files: list) -> str:
        # Simple framework detection logic
        file_list = " ".join(files).lower()
        frameworks = []
        if "fastapi" in file_list or "main.py" in file_list:
            frameworks.append("FastAPI (Python)")
        if "react" in file_list or ".jsx" in file_list:
            frameworks.append("React (Frontend)")
        if "package.json" in file_list:
            frameworks.append("Node.js / Web")
        
        return ", ".join(frameworks) if frameworks else "Generic Python/Web structure"

architecture_summarizer = ArchitectureSummarizer()

from workspace.graph.extractor import workspace_graph
from typing import List, Set
import networkx as nx

class DependencyTraversal:
    def __init__(self):
        self.graph = workspace_graph.graph

    def trace_dependencies(self, file_path: str) -> List[str]:
        """Finds all files/modules that the given file depends on."""
        if file_path not in self.graph:
            return []
        
        deps = []
        for neighbor in self.graph.neighbors(file_path):
            rel = self.graph.get_edge_data(file_path, neighbor).get('relationship')
            if rel in ['imports', 'imports_from']:
                deps.append(neighbor)
        return deps

    def trace_callers(self, function_name: str) -> List[str]:
        """Finds all files/functions that call the given function."""
        callers = []
        for u, v, data in self.graph.edges(data=True):
            if data.get('relationship') == 'calls' and v == function_name:
                callers.append(u)
        return callers

    def get_impact_surface(self, file_path: str) -> Set[str]:
        """Finds all files that would be affected by changing the given file."""
        if file_path not in self.graph:
            return set()
            
        # Impact is basically the reverse of dependencies (who imports me?)
        impacted = set()
        for u, v, data in self.graph.edges(data=True):
            if v == file_path and data.get('relationship') in ['imports', 'imports_from']:
                impacted.add(u)
        return impacted

    def get_related_context(self, file_path: str, depth: int = 1) -> List[str]:
        """Retrieves a surrounding neighborhood of nodes in the graph."""
        if file_path not in self.graph:
            return []
            
        nodes = nx.single_source_shortest_path_length(self.graph, file_path, cutoff=depth).keys()
        return list(nodes)

dependency_traversal = DependencyTraversal()

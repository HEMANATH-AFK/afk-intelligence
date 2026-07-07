import os
import shutil
import tempfile
from pathlib import Path
from tools.terminal import TerminalSandbox
from execution.snapshots import RollbackManager
from workspace.graph.extractor import GraphExtractor

def test_terminal_sandbox_cd_and_safety():
    # Setup a temp workspace
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create subfolders
        sub1 = Path(tmpdir) / "sub1"
        sub1.mkdir()
        sub2 = Path(tmpdir) / "sub2"
        sub2.mkdir()
        
        sandbox = TerminalSandbox(tmpdir)
        
        # Test default CWD is workspace root
        assert Path(sandbox.cwd).resolve() == Path(tmpdir).resolve()
        
        # Test navigation to sub1
        res = sandbox.execute("cd sub1")
        assert "[CWD CHANGED]" in res
        assert Path(sandbox.cwd).resolve() == sub1.resolve()
        
        # Test navigation to sub2 from sub1 (relative)
        res = sandbox.execute("cd ../sub2")
        assert "[CWD CHANGED]" in res
        assert Path(sandbox.cwd).resolve() == sub2.resolve()
        
        # Test navigation back to root
        res = sandbox.execute("cd")
        assert "[CWD CHANGED]" in res
        assert Path(sandbox.cwd).resolve() == Path(tmpdir).resolve()
        
        # Test directory not found
        res = sandbox.execute("cd nonexistent_dir")
        assert "[ERROR]" in res
        
        # Test path-traversal security check (navigating outside root)
        res = sandbox.execute("cd ../")
        assert "[SECURITY ALERT]" in res
        
        # Test absolute path outside workspace root
        res = sandbox.execute("cd /")
        assert "[SECURITY ALERT]" in res

def test_rollback_manager_nested_subdirectories():
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create nested directory and files
        subdir = Path(tmpdir) / "src" / "nested"
        subdir.mkdir(parents=True)
        file1 = subdir / "test.py"
        with open(file1, "w") as f:
            f.write("print('hello')")
            
        manager = RollbackManager(tmpdir)
        
        # Create snapshot
        snapshot_id = manager.create_snapshot("session_test", [str(file1)])
        
        # Check snapshot was created and directory structure exists
        snapshot_dir = manager.backup_dir / "session_test" / snapshot_id
        assert snapshot_dir.exists()
        backup_file = snapshot_dir / "src" / "nested" / "test.py"
        assert backup_file.exists()
        
        # Modify the original file
        with open(file1, "w") as f:
            f.write("print('modified')")
            
        # Rollback
        success = manager.rollback("session_test", snapshot_id)
        assert success
        
        # Verify content restored
        with open(file1, "r") as f:
            content = f.read()
        assert content == "print('hello')"

def test_graph_extractor_class_inheritance():
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a Python file with a class hierarchy
        file_path = Path(tmpdir) / "app.py"
        with open(file_path, "w") as f:
            f.write(
                "class Parent:\n"
                "    pass\n\n"
                "class Child(Parent):\n"
                "    pass\n\n"
                "class RemoteChild(module.RemoteParent):\n"
                "    pass\n"
            )
            
        extractor = GraphExtractor(tmpdir)
        extractor.build_graph()
        
        # Verify class nodes exist
        child_node_id = "app.py::Child"
        remote_child_node_id = "app.py::RemoteChild"
        assert child_node_id in extractor.graph.nodes
        assert remote_child_node_id in extractor.graph.nodes
        
        # Verify inherits edges exist
        assert extractor.graph.has_edge(child_node_id, "Parent")
        edge_data_child = extractor.graph.get_edge_data(child_node_id, "Parent")
        assert edge_data_child["relationship"] == "inherits"
        
        assert extractor.graph.has_edge(remote_child_node_id, "module.RemoteParent")
        edge_data_remote = extractor.graph.get_edge_data(remote_child_node_id, "module.RemoteParent")
        assert edge_data_remote["relationship"] == "inherits"

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
        edge_data_remote = extractor.graph.get_edge_data(
            remote_child_node_id, "module.RemoteParent"
        )
        assert edge_data_remote["relationship"] == "inherits"


def test_terminal_sandbox_history():
    with tempfile.TemporaryDirectory() as tmpdir:
        sandbox = TerminalSandbox(tmpdir)
        assert len(sandbox.history) == 0
        sandbox.execute("git status")
        sandbox.execute("cd nonexistent")
        assert sandbox.history == ["git status", "cd nonexistent"]


def test_terminal_sandbox_duration_and_env():
    with tempfile.TemporaryDirectory() as tmpdir:
        sandbox = TerminalSandbox(tmpdir, env={"TEST_VAR": "hello_from_test"})
        assert sandbox.env == {"TEST_VAR": "hello_from_test"}
        assert sandbox.last_duration == 0.0

        sandbox.execute("git status")
        assert sandbox.last_duration >= 0.0
        assert sandbox.history[-1] == "git status"


def test_workspace_scanner_enhancements():
    from workspace.scanner import WorkspaceScanner

    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir).joinpath("pyproject.toml").write_text(
            "sqlalchemy\ncelery\nredis", encoding="utf-8"
        )
        Path(tmpdir).joinpath("Dockerfile").write_text(
            "FROM python:3.9", encoding="utf-8"
        )

        scanner = WorkspaceScanner()
        res = scanner.analyze_project(tmpdir)
        techs = res["technologies"]
        assert "Python" in techs
        assert "SQLAlchemy" in techs
        assert "Celery" in techs
        assert "Redis" in techs
        assert "Docker" in techs

        # Verify metrics counts
        metrics = res["metrics"]
        assert metrics["file_count"] == 2
        assert metrics["directory_count"] == 0

        # Create a nested folder with a file to test depth and counting
        subdir = Path(tmpdir) / "src"
        subdir.mkdir()
        Path(subdir / "test.py").write_text("print(1)", encoding="utf-8")

        res2 = scanner.analyze_project(tmpdir)
        assert res2["metrics"]["file_count"] == 3
        assert res2["metrics"]["directory_count"] == 1


def test_graph_extractor_docstring():
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "app.py"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(
                "class Parent:\n"
                '    """This is Parent docstring"""\n'
                "    pass\n\n"
                "def func():\n"
                '    """This is func docstring"""\n'
                "    pass\n"
            )
        extractor = GraphExtractor(tmpdir)
        extractor.build_graph()

        parent_node = "app.py::Parent"
        func_node = "app.py::func"

        assert parent_node in extractor.graph.nodes
        assert func_node in extractor.graph.nodes

        assert (
            extractor.graph.nodes[parent_node]["docstring"]
            == "This is Parent docstring"
        )
        assert extractor.graph.nodes[func_node]["docstring"] == "This is func docstring"


def test_graph_extractor_sloc():
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "app.py"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(
                "class Parent:\n"
                "    def test(self):\n"
                "        pass\n\n"
                "def func():\n"
                "    x = 1\n"
                "    return x\n"
            )
        extractor = GraphExtractor(tmpdir)
        extractor.build_graph()

        parent_node = "app.py::Parent"
        func_node = "app.py::func"

        assert parent_node in extractor.graph.nodes
        assert func_node in extractor.graph.nodes

        assert extractor.graph.nodes[parent_node]["sloc"] == 3
        assert extractor.graph.nodes[func_node]["sloc"] == 3


def test_graph_extractor_param_count():
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "app.py"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(
                "def func_no_args():\n"
                "    pass\n\n"
                "def func_args(a, b, *c, d=1, **e):\n"
                "    pass\n"
            )
        extractor = GraphExtractor(tmpdir)
        extractor.build_graph()

        node_no_args = "app.py::func_no_args"
        node_args = "app.py::func_args"

        assert node_no_args in extractor.graph.nodes
        assert node_args in extractor.graph.nodes

        assert extractor.graph.nodes[node_no_args]["param_count"] == 0
        assert extractor.graph.nodes[node_args]["param_count"] == 5


def test_graph_extractor_is_async():
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "app.py"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(
                "def regular_func():\n    pass\n\nasync def async_func():\n    pass\n"
            )
        extractor = GraphExtractor(tmpdir)
        extractor.build_graph()

        reg_node = "app.py::regular_func"
        async_node = "app.py::async_func"

        assert reg_node in extractor.graph.nodes
        assert async_node in extractor.graph.nodes

        assert not extractor.graph.nodes[reg_node]["is_async"]
        assert extractor.graph.nodes[async_node]["is_async"]


def test_workspace_scanner_config_files():
    from workspace.scanner import WorkspaceScanner

    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir).joinpath("setup.py").write_text("# setup", encoding="utf-8")
        Path(tmpdir).joinpath("setup.cfg").write_text("# config", encoding="utf-8")
        Path(tmpdir).joinpath("random.txt").write_text("# random", encoding="utf-8")

        scanner = WorkspaceScanner()
        res = scanner.analyze_project(tmpdir)
        configs = res["config_files"]
        assert "setup.py" in configs
        assert "setup.cfg" in configs
        assert "random.txt" not in configs

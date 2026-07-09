import json
import os
from pathlib import Path


class WorkspaceScanner:
    def __init__(self, ignore_dirs=None):
        self.ignore_dirs = ignore_dirs or [
            ".git",
            "node_modules",
            "venv",
            "__pycache__",
            "dist",
            "build",
        ]

    def analyze_project(self, path: str):
        path_obj = Path(path)
        if not path_obj.exists() or not path_obj.is_dir():
            raise ValueError(f"Invalid directory path: {path}")

        structure = self._get_directory_structure(path_obj)
        package_json = self._read_json_file(path_obj / "package.json")
        requirements_txt = self._read_text_file(path_obj / "requirements.txt")
        pyproject_toml = self._read_text_file(path_obj / "pyproject.toml")
        docker_present = (path_obj / "Dockerfile").exists() or (
            path_obj / "docker-compose.yml"
        ).exists()

        technologies = self._detect_technologies(
            package_json, requirements_txt, pyproject_toml, docker_present
        )
        architecture = self._infer_architecture(structure, technologies)
        file_count, dir_count = self._count_elements(path_obj)

        config_files_to_check = [
            "setup.py",
            "pyproject.toml",
            "requirements.txt",
            "setup.cfg",
            "tox.ini",
        ]
        config_files = [f for f in config_files_to_check if (path_obj / f).exists()]

        return {
            "path": str(path_obj.absolute()),
            "name": path_obj.name,
            "technologies": technologies,
            "architecture_summary": architecture,
            "dependencies": package_json.get("dependencies", {})
            if package_json
            else {},
            "structure": structure,
            "metrics": {"file_count": file_count, "directory_count": dir_count},
            "config_files": config_files,
        }

    def _count_elements(self, path_obj: Path) -> tuple[int, int]:
        file_count = 0
        dir_count = 0
        try:
            for root, dirs, files in os.walk(path_obj):
                dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
                dir_count += len(dirs)
                file_count += len(files)
        except Exception:
            pass
        return file_count, dir_count

    def _get_directory_structure(self, root_path: Path, max_depth=3) -> dict:
        def build_tree(current_path: Path, current_depth: int) -> dict:
            if current_depth > max_depth:
                return {"type": "directory", "name": current_path.name, "children": []}

            tree = {"type": "directory", "name": current_path.name, "children": []}
            try:
                for item in current_path.iterdir():
                    if item.name in self.ignore_dirs:
                        continue
                    if item.is_dir():
                        tree["children"].append(build_tree(item, current_depth + 1))
                    else:
                        tree["children"].append({"type": "file", "name": item.name})
            except PermissionError:
                pass
            return tree

        return build_tree(root_path, 1)

    def _read_json_file(self, file_path: Path) -> dict:
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _read_text_file(self, file_path: Path) -> str:
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception:
                pass
        return ""

    def _detect_technologies(
        self,
        package_json: dict,
        requirements_txt: str,
        pyproject_toml: str = "",
        docker_present: bool = False,
    ) -> list:
        tech = []
        if package_json:
            tech.append("Node.js")
            deps = {
                **package_json.get("dependencies", {}),
                **package_json.get("devDependencies", {}),
            }
            if "react" in deps:
                tech.append("React")
            if "next" in deps:
                tech.append("Next.js")
            if "express" in deps:
                tech.append("Express")
            if "tailwindcss" in deps:
                tech.append("TailwindCSS")
            if "typescript" in deps:
                tech.append("TypeScript")
            if "mongoose" in deps or "mongodb" in deps:
                tech.append("MongoDB")

        if requirements_txt or pyproject_toml:
            tech.append("Python")
            combined_python_config = (requirements_txt + "\n" + pyproject_toml).lower()
            if "fastapi" in combined_python_config:
                tech.append("FastAPI")
            if "django" in combined_python_config:
                tech.append("Django")
            if "flask" in combined_python_config:
                tech.append("Flask")
            if "redis" in combined_python_config:
                tech.append("Redis")
            if "celery" in combined_python_config:
                tech.append("Celery")
            if "sqlalchemy" in combined_python_config:
                tech.append("SQLAlchemy")

        if docker_present:
            tech.append("Docker")

        return list(set(tech))

    def _infer_architecture(self, structure: dict, technologies: list) -> str:
        # A simple rule-based architecture inference
        if "React" in technologies and "Express" in technologies:
            return "MERN Stack Application (or similar Node/React monorepo)"
        if "FastAPI" in technologies and "React" in technologies:
            return "Modern Decoupled Architecture: React Frontend with FastAPI Backend"
        if "Next.js" in technologies:
            return "Server-Side Rendered React Application (Next.js)"

        return "Standard Directory Structure"


workspace_scanner = WorkspaceScanner()

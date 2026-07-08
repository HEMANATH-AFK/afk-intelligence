"""
Unit tests for backend core execution and risk systems.
"""

from execution.risk import risk_classifier, RiskLevel
from workspace.graph.extractor import GraphExtractor
import os


def test_risk_classification_low():
    """Verify that safe read-only commands classify as LOW risk."""
    res = risk_classifier.classify("ls -la")
    assert res["level"] == RiskLevel.LOW
    assert not res["requires_approval"]


def test_risk_classification_low_extra():
    """Verify that echo, git diff, git show, and git branch also classify as LOW risk."""
    res_echo = risk_classifier.classify("echo hello")
    res_diff = risk_classifier.classify("git diff HEAD")
    res_show = risk_classifier.classify("git show e0aca27")
    res_branch = risk_classifier.classify("git branch -a")
    assert res_echo["level"] == RiskLevel.LOW
    assert res_diff["level"] == RiskLevel.LOW
    assert res_show["level"] == RiskLevel.LOW
    assert res_branch["level"] == RiskLevel.LOW
    assert not res_echo["requires_approval"]
    assert not res_diff["requires_approval"]
    assert not res_show["requires_approval"]
    assert not res_branch["requires_approval"]


def test_risk_classification_high():
    """Verify that potentially destructive commands classify as HIGH risk and need approval."""
    res = risk_classifier.classify("rm -rf /")
    assert res["level"] == RiskLevel.HIGH
    assert res["requires_approval"]


def test_risk_classification_critical():
    """Verify that dangerous system-level commands classify as CRITICAL and are blocked."""
    res = risk_classifier.classify("sudo apt update")
    assert res["level"] == RiskLevel.CRITICAL
    assert res["is_blocked"]


def test_risk_classification_critical_extra():
    """Verify that dd and rmdir are blocked as CRITICAL risk."""
    res_dd = risk_classifier.classify("dd if=/dev/zero of=/dev/sdb")
    res_rmdir = risk_classifier.classify("rmdir /s /q testdir")
    assert res_dd["level"] == RiskLevel.CRITICAL
    assert res_dd["is_blocked"]
    assert res_rmdir["level"] == RiskLevel.CRITICAL
    assert res_rmdir["is_blocked"]


def test_graph_extraction_basic():
    """Verify basic instantiation and properties of GraphExtractor."""
    extractor = GraphExtractor(os.getcwd())
    # Note: build_graph() might take time in a real repo, so we just test the object
    assert extractor.workspace_root is not None
    assert extractor.graph is not None


def test_risk_classification_medium():
    res = risk_classifier.classify("npm install")
    assert res["level"] == RiskLevel.MEDIUM
    assert res["requires_approval"]
    assert not res["is_blocked"]

    res_poetry = risk_classifier.classify("poetry run pytest")
    assert res_poetry["level"] == RiskLevel.MEDIUM
    assert res_poetry["requires_approval"]
    assert not res_poetry["is_blocked"]

    res_py = risk_classifier.classify("python -m pytest")
    assert res_py["level"] == RiskLevel.MEDIUM
    assert res_py["requires_approval"]
    assert not res_py["is_blocked"]


def test_risk_classification_unknown():
    res = risk_classifier.classify("some-random-unknown-command")
    assert res["level"] == RiskLevel.HIGH
    assert res["requires_approval"]
    assert not res["is_blocked"]


def test_get_description():
    """Verify that get_description retrieves the correct description for risk levels."""
    assert risk_classifier.get_description(RiskLevel.LOW) == "Read-only operations"
    assert (
        risk_classifier.get_description(RiskLevel.HIGH)
        == "Potentially destructive or system-altering"
    )
    assert risk_classifier.get_description("INVALID_LEVEL") == "Unknown risk level"

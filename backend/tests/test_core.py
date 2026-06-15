from execution.risk import risk_classifier, RiskLevel
from workspace.graph.extractor import GraphExtractor
import os

def test_risk_classification_low():
    res = risk_classifier.classify("ls -la")
    assert res["level"] == RiskLevel.LOW
    assert not res["requires_approval"]

def test_risk_classification_high():
    res = risk_classifier.classify("rm -rf /")
    assert res["level"] == RiskLevel.HIGH
    assert res["requires_approval"]

def test_risk_classification_critical():
    res = risk_classifier.classify("sudo apt update")
    assert res["level"] == RiskLevel.CRITICAL
    assert res["is_blocked"]

def test_graph_extraction_basic():
    extractor = GraphExtractor(os.getcwd())
    # Note: build_graph() might take time in a real repo, so we just test the object
    assert extractor.workspace_root is not None
    assert extractor.graph is not None

def test_risk_classification_medium():
    res = risk_classifier.classify("npm install")
    assert res["level"] == RiskLevel.MEDIUM
    assert res["requires_approval"]
    assert not res["is_blocked"]

def test_risk_classification_unknown():
    res = risk_classifier.classify("some-random-unknown-command")
    assert res["level"] == RiskLevel.HIGH
    assert res["requires_approval"]
    assert not res["is_blocked"]

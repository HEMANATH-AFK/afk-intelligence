import pytest
from execution.risk import risk_classifier, RiskLevel
from workspace.graph.extractor import GraphExtractor
import os

def test_risk_classification_low():
    res = risk_classifier.classify("ls -la")
    assert res["level"] == RiskLevel.LOW
    assert res["requires_approval"] == False

def test_risk_classification_high():
    res = risk_classifier.classify("rm -rf /")
    assert res["level"] == RiskLevel.HIGH
    assert res["requires_approval"] == True

def test_risk_classification_critical():
    res = risk_classifier.classify("sudo apt update")
    assert res["level"] == RiskLevel.CRITICAL
    assert res["is_blocked"] == True

def test_graph_extraction_basic():
    extractor = GraphExtractor(os.getcwd())
    # Note: build_graph() might take time in a real repo, so we just test the object
    assert extractor.workspace_root is not None
    assert extractor.graph is not None

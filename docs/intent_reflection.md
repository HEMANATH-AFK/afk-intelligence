# Intent Classification & Reflection Engine

This document outlines the classification of user requests and the evaluation loop used to verify agent actions.

## 1. Intent Classification

Before a workflow is initiated, the system classifies incoming messages using the `IntentClassifier`. This determines the execution path and activates specialized context boundaries.

### Classified Intents & Keywords

- **`ARCHITECTURE_ANALYSIS`**: Triggered by keywords like *architecture*, *structure*, *design*, *how is it built*.
- **`BUG_DIAGNOSIS`**: Triggered by keywords like *bug*, *fail*, *error*, *crash*, *fix*, *issue*.
- **`REFACTORING`**: Triggered by keywords like *refactor*, *clean*, *simplify*, *modularize*.
- **`SECURITY_REVIEW`**: Triggered by keywords like *security*, *vulnerability*, *auth*, *leak*, *jwt*.
- **`PERFORMANCE_ANALYSIS`**: Triggered by keywords like *slow*, *performance*, *bottleneck*, *latency*.
- **`DEPENDENCY_TRACE`**: Triggered by keywords like *depends*, *import*, *call*, *caller*, *dependency*.
- **`STATE_FLOW`**: Triggered by keywords like *state*, *prop*, *flow*, *context*, *store*, *zustand*.
- **`TERMINAL_EXECUTION`**: Triggered by keywords like *run*, *execute*, *command*, *npm*, *pip*, *git*.
- **`GENERIC_CHAT`**: Default fallback for standard conversational queries.

---

## 2. Reflection Engine

The `ReflectionEngine` verifies that the steps executed by the agent match the desired outcome. 

### Verification Loop

After an agent executes a tool call, the `ReflectionEngine` queries the model using a verification prompt:
1. **Goal Evaluation:** Did the action fulfill the specific objective?
2. **Regression Check:** Did the command output include warnings, stack traces, or regressions?
3. **Confidence Scoring:** Outputs a value between `0.0` (failure/high risk) and `1.0` (perfect completion).

The evaluation result is parsed as a structured JSON object containing:
- `success` (boolean)
- `confidence` (float)
- `analysis` (string details)
- `requires_remediation` (boolean)
- `next_suggestion` (string)


### Intents: Command Classifier Logic
The parser classifies operator instructions. Safe commands execute immediately, while modification tasks request tool plans.

### Reflection: Output Evaluation Checklist
The reflection agent evaluates output results against criteria: does code compile, do tests pass, does syntax meet quality guidelines.
# Multi-Agent Orchestration Engine

This document describes how AFK-Intelligence delegates tasks to specialized agent personas, coordinates execution steps, and manages state transitions.

## Agent Persona Roles

The cognitive engine leverages a specialized agent crew, each defined with specific guidelines and behaviors:

1. **Lead Architect (`ARCHITECT`)**
   - **Goal:** Decomposes a top-level user goal into an ordered sequence of discrete, actionable steps (e.g. read files, edit code, run terminal command).
   - **Constraint:** Prioritizes separation of concerns, modular designs, and dependency graphs.

2. **Senior Software Engineer (`CODER`)**
   - **Goal:** Executes code modification, writes new scripts, and performs workspace updates.
   - **Constraint:** Follows project conventions and prioritizes code readability.

3. **Code Reviewer (`REVIEWER`)**
   - **Goal:** Audits proposed changes for code smells, bugs, security vulnerabilities, or anti-patterns.
   - **Constraint:** Be critical and provide concrete remediation suggestions.

4. **QA Automation Engineer (`TESTER`)**
   - **Goal:** Verifies system outcomes, designs tests, checks coverage, and flags regressions.

---

## Orchestrator Lifecycle States

The agent orchestrator tracks work progress using the `OrchestratorState` state machine:

- `RECEIVE_GOAL`: Handshake state where user request is parsed and validated.
- `PLAN_WORKFLOW`: The **Architect** agent creates a stepwise JSON execution plan.
- `DELEGATE_TASK`: Tasks are assigned to the appropriate agents.
- `EXECUTE_STEP`: The **Coder** executes step actions or invokes tools.
- `VERIFY_STEP`: The **Tester** reflects on outputs to verify correctness.
- `COMPLETE`: Terminal state displaying success metrics and final reports.

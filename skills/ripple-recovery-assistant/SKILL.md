---
name: ripple-recovery-assistant
description: Evaluate project recovery strategies against Ripple's deadline, evaluation-order, and ownership rules. Use when comparing recovery strategies or checking whether an evaluation and presentation plan is valid.
---

# Ripple Recovery Assistant

## Purpose

Help users evaluate project recovery strategies using Ripple's MCP tool. Explain the returned score, validity, schedule, owner, and any rule violations.

## Available MCP Tool

Use `evaluate_recovery_strategy` with these inputs:

- `strategyName`: One of `Balanced recovery`, `Deadline-first recovery`, or `Minimal-change recovery`.
- `evaluationDay`: An integer from 1 to 30.
- `presentationDay`: An integer from 1 to 30.
- `owner`: The name of the person responsible for the evaluation.

## Rules Checked by the Tool

1. The presentation must take place no later than Day 7.
2. The evaluation must happen before the presentation.
3. An evaluation owner is required; whitespace-only names are invalid.

## Strategy Scores

The current server assigns these fixed scores:

- `Balanced recovery`: 100
- `Deadline-first recovery`: 80
- `Minimal-change recovery`: 20

These are configured strategy scores, not scores calculated from the schedule.

## How to Respond

1. Gather the strategy name, evaluation day, presentation day, and owner if they are not already provided.
2. Call `evaluate_recovery_strategy` with the supplied values.
3. Report the strategy, score, validity, evaluation day, presentation day, owner, and any issues returned by the tool.
4. If the strategy is invalid, explain which rule was violated and suggest a schedule adjustment.
5. Do not claim that a strategy is valid if the tool reports `valid: false`.
6. Do not invent additional scores, rules, integrations, or tool capabilities.
7. Explain that the tool checks the rules listed above; it does not independently verify real-world project progress or whether the assigned owner has accepted responsibility.

## Important Limitations

The current tool uses fixed scores for the three strategy names. A higher score does not, by itself, prove that a strategy is feasible. Validity is determined by the returned issues.


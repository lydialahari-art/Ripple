# Ripple — Project Recovery Assistant

Ripple evaluates project recovery strategies against deadline, evaluation-order, and ownership rules. It returns a configured strategy score, validates the schedule, and reports any issues.

## Features

- Evaluate three recovery strategies.
- Validate presentation deadlines.
- Check evaluation and presentation order.
- Require an evaluation owner.
- Return structured results through an MCP tool.
- Provide a React web interface connected to the backend.

## Technology Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Agent integration: Model Context Protocol (MCP), Streamable HTTP
- Input validation: Zod

## Live Services

- Backend health check: https://ripple-g1ji.onrender.com/health
- MCP endpoint: https://ripple-g1ji.onrender.com/mcp
- Frontend: Use the deployed URL shown in the Render dashboard.

The backend may take time to respond after inactivity on the hosting provider's free tier.

## MCP Tool

Tool name: `evaluate_recovery_strategy`

Inputs:

| Field | Type | Description |
|---|---|---|
| `strategyName` | string | `Balanced recovery`, `Deadline-first recovery`, or `Minimal-change recovery` |
| `evaluationDay` | integer | Day from 1 to 30 |
| `presentationDay` | integer | Day from 1 to 30 |
| `owner` | string | Person responsible for the evaluation |

### Validation Rules

1. Presentation must occur by Day 7.
2. Evaluation must happen before presentation.
3. The owner must not be empty or whitespace only.

### Configured Scores

| Strategy | Score |
|---|---:|
| Balanced recovery | 100 |
| Deadline-first recovery | 80 |
| Minimal-change recovery | 20 |

Scores are fixed by strategy name and are not calculated from schedule quality. Validity depends on the validation rules.

## Example

A Balanced recovery plan with evaluation on Day 5, presentation on Day 7, and owner Rahul returns a score of 100 and `valid: true`, with no issues.

A Minimal-change recovery plan with evaluation on Day 6 and presentation on Day 8 fails the Day 7 deadline rule.

## Run Locally

Requirements: Node.js and npm.

### Backend

Open a terminal:

```powershell
cd apps/server
npm install
npm run dev
```

The backend runs on port 3001 by default.

- Health check: http://localhost:3001/health
- MCP endpoint: http://localhost:3001/mcp

### Frontend

Open a second terminal:

```powershell
cd apps/web
npm install
npm run dev
```

For production, set `VITE_API_BASE_URL` to the backend base URL.

## Agent Skill

Skill definition: `skills/ripple-recovery-assistant/SKILL.md`

This file documents the MCP tool, its inputs, validation rules, configured scores, and limitations. Creating a skill file does not automatically register it with Alexa+.

## Limitations

- Strategy scores are fixed values.
- The tool does not verify real-world project progress or owner availability.
- The current MCP server exposes one tool.

## Repository

https://github.com/lydialahari-art/Ripple



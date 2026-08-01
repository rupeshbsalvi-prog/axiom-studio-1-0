# Development Division Ownership

[Back to docs index](../README.md)

## Purpose

Define enterprise development ownership for Axiom Studio 1.0 and Axiom Imagine X.

## Divisions

| Division | System Responsibility | Axiom Ownership Area |
|---|---|---|
| Product | requirements, scope, acceptance | product docs, roadmap, phase gates |
| Design | UX, UI, design system, prototypes | shell, studios, Axiom Prism system |
| Architecture | enterprise, solution, technical design | monorepo, runtime, contracts, security |
| Frontend | React UI, canvas, state, interaction | web app, studio surfaces, UI package |
| Backend | API, jobs, providers, auth | FastAPI app, provider services |
| Database | schemas, migrations, persistence | SQLite, PostgreSQL, AXPKG metadata |
| AI / Imagine X | orchestration, agents, memory, evals | Imagine X subsystem |
| DevOps | CI/CD, deployment, monitoring | build/release infrastructure |
| Security | auth, RBAC, compliance, secrets | security architecture, provider vault |
| QA | test strategy and gates | unit, integration, E2E, evals |
| Documentation | guides, API docs, knowledge base | docs and release notes |
| Support | incident handling and customer success | support tools, diagnostics |
| Analytics | product and system insight | dashboards, reports, usage metrics |
| Release | builds, versioning, production admin | release candidates and deployment |

## Implementation Rule

Every phase must identify the impacted divisions and update the matching docs or ownership notes.

## Locked Baseline

Changes require an ADR.

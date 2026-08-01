# Imagine X Command Hierarchy

[Back to docs index](../README.md)

## Purpose

Prevent Axiom Imagine X from failing on huge projects by distributing work through a clear hierarchy. The right mental model is not only an employee hierarchy; it is a software company inside the application, where each responsibility becomes a system role, module, workflow, or quality gate.

## Hierarchy

| Level | Role | Responsibility | Output |
|---|---|---|---|
| L0 | User / Client | Defines goal, constraints, brand, audience, and approval | creative brief |
| L1 | Chief Director | Owns final creative vision and success criteria | master direction |
| L2 | Executive Producer | Breaks project into phases, dependencies, checkpoints, and deliverables | production plan |
| L3 | Studio Directors | Own domain direction for Photo, Vector, Motion, Video, Brand, Typography, Presentation, Whiteboard, Asset Hub | studio briefs |
| L4 | Specialists | Handle composition, typography, motion, copy, brand, provider routing, layout, editing, export | specialist plans |
| L5 | Operators | Execute provider calls, asset generation, layout drafts, keyframes, object proposals | candidate outputs |
| L6 | Guardian Critics | Validate exact requirements, quality, editability, brand, safety, and replay readiness | critique reports |
| L7 | Repairers | Fix rejected or weak outputs with targeted changes | repair proposals |
| L8 | Memory Curator | Learns from accepted/rejected outcomes and updates explainable memory | memory events |

## Enterprise Extension

For platform-scale work, Imagine X must also route tasks through enterprise role lenses:

- Product: requirements and acceptance.
- Design: user experience and visual quality.
- Architecture: system boundaries and contracts.
- Frontend: UI and interaction feasibility.
- Backend: APIs and job flow.
- Database: persistence and migration impact.
- AI: model, prompt, memory, routing, and eval quality.
- DevOps: deployment and monitoring.
- Security: auth, permissions, secrets, compliance.
- QA: automated, manual, performance, security, and UAT gates.
- Documentation: user, API, release, and knowledge base docs.
- Support: diagnostics, incident readiness, and maintainability.

## Control Rule

No lower level can finalize project truth. Operators and providers create candidates. Guardians validate candidates. Chief Director and user approval decide whether a proposal is ready for semantic command conversion.

## Large Project Behavior

For big projects, Imagine X must:

- Create a master direction before generating assets.
- Split work by studio and deliverable.
- Assign each subtask a role owner.
- Track dependencies between subtasks.
- Run Guardian checks at subtask and final package levels.
- Recompose approved subtasks into one coherent project proposal.
- Keep a trace of decisions, rejected options, repairs, and accepted outputs.

## Failure Prevention

The hierarchy prevents:

- One prompt trying to solve every detail at once.
- Motion, graphics, typography, and brand decisions conflicting.
- Provider failures blocking the whole project.
- Weak subtasks silently entering the final result.
- Memory learning from failed or rejected outputs.
- Enterprise features shipping without product, security, QA, documentation, release, or support ownership.

## Locked Baseline

Changes require an ADR.

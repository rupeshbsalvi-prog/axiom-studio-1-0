# Imagine X Large Project Orchestration

[Back to docs index](../README.md)

## Purpose

Define how Axiom Imagine X processes huge creative projects seamlessly without overloading one model call, one provider, or one studio workflow.

## Orchestration Flow

1. Intake: capture goal, audience, format, deliverables, brand rules, deadline, and constraints.
2. Decompose: split project into studio deliverables and dependency groups.
3. Direct: Chief Director sets one master creative direction.
4. Plan: Executive Producer creates a staged production plan.
5. Assign: Studio Directors and Specialists receive scoped tasks.
6. Execute: Operators call providers or local engines for specific candidates.
7. Validate: Guardian Critics score each candidate.
8. Repair: Repairers fix failures before recomposition.
9. Recompose: approved pieces become one coherent proposal package.
10. Approve: user accepts, rejects, or requests changes.
11. Convert: accepted proposals become semantic command drafts.
12. Learn: Memory Curator logs outcomes and updates explainable memory.

## Task Packet Contract

Each subtask should include:

- Task ID.
- Parent task ID.
- Role owner.
- Studio target.
- Input requirements.
- Expected output.
- Dependencies.
- Provider route.
- Quality gate.
- Status.
- Trace notes.

## Status Model

Use these statuses for orchestration:

- queued
- planning
- assigned
- executing
- validating
- repairing
- ready_for_recomposition
- blocked
- rejected
- accepted
- converted_to_command

## Seamless Processing Rules

- Run independent studio tasks in parallel where possible.
- Keep dependent tasks sequential when brand, layout, or narrative order matters.
- Show progress by deliverable, not just one global spinner.
- Let partial successes survive provider failures.
- Never collapse the final package until critical subtasks pass Guardian checks.
- Preserve editability and provenance for every accepted part.

## Example Huge Project

For a full campaign request, Imagine X should create:

- Brand direction.
- Hero poster in Photo Studio.
- Logo or icon refinements in Vector Studio.
- Motion reel plan in Motion Studio.
- Presentation deck in Presentation Studio.
- Asset collection in Asset Hub.
- Export plan and audit trace.

Each deliverable is planned, generated, checked, repaired, and then recomposed into one campaign workspace.

## Locked Baseline

Changes require an ADR.

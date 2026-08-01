# Axiom AI Studio

[Back to docs index](../README.md)

## Purpose

Expose Axiom Imagine X as a full studio for planning, agent workflows, model routing, learning, memory, and diagnostics.

The full Imagine X subsystem is documented in `docs/brain/`.

## User-Facing Behavior

Users can work with Imagine X, review director plans, inspect agents, compare models, train preferences, and manage creative memory.

## Required UI Regions

Conversation, agent status, plan view, memory dashboard, model performance report, outcome rating.

## Required Data/State

Prompts, director plans, agent states, memory graph, model preferences, outcomes, ratings, provider statuses.

## Generation Requirements

Axiom AI Studio is the command center for Axiom Imagine X. It must not behave like a generic chat screen. It must expose structured planning, agent hierarchy, enterprise role lenses, provider routing, eval results, memory, task packets, and accepted/rejected proposal history.

Supported categories include creative direction, campaign planning, studio orchestration, product design review, prompt refinement, provider comparison, memory inspection, model performance, eval reports, repair workflows, task decomposition, and enterprise development planning.

Outputs should be structured director plans, task trees, prompt packages, provider routes, critique reports, repair plans, memory updates, and semantic command proposals.

## Events/Actions It Emits

Submit prompt, generate plan, accept plan, reject plan, rate outcome, retrain memory, switch model.

## Workflow

1. Capture user intent or project context.
2. Run Imagine X command hierarchy: Chief Director, Executive Producer, Studio Directors, Specialists, Operators, Guardians, Repairers, Memory Curator.
3. Show first-impression director plan and task tree.
4. User approves, rejects, or edits the plan.
5. Route approved tasks to the right studio or provider.
6. Monitor progress, failures, repairs, evals, and provenance.
7. Convert accepted proposals into studio actions or semantic command drafts.
8. Log outcomes to memory.

## Dependencies

Axiom Imagine X backend, provider connector hub, project AXPKG system, memory system.

## Wiring Notes

Axiom AI Studio can orchestrate other studios through Imagine X but still cannot bypass semantic command approval.

## Phase Status

Phase 02 target for core Imagine X visibility, deeper features later.

## Acceptance Criteria

Users can understand what Imagine X planned, why, and what happened after execution.

The studio must expose agent traces, provider route decisions, memory explanations, eval status, director standard checks, and accepted/rejected proposal history as Imagine X matures.

First-impression plans show role hierarchy, task packets, affected studios, dependencies, provider routes, quality gates, risks, and expected outputs before execution.

## Locked Baseline

Changes require an ADR.

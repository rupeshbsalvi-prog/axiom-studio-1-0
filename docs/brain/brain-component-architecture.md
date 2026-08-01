# Imagine X Component Architecture

[Back to docs index](../README.md)

## Component Boundaries

| Component | Responsibility | Output |
|---|---|---|
| Intent Engine | Parse user prompt, sketch, or future voice transcript | normalized intent |
| Command Hierarchy Manager | Break huge requests into director, executive, specialist, and operator tasks | task tree |
| Requirement Planner | Convert intent into project/studio requirements | plan requirements |
| Creative Director | Choose style, composition, tone, pacing, brand fit | creative direction |
| Provider Router | Select model/tool/provider for each task | route decision |
| Generation Orchestrator | Coordinate provider calls and staged results | candidate assets/objects |
| Guardian Critic | Validate quality, text, layout, brand, safety, object count | critique report |
| Repair Engine | Produce targeted fixes for failed outputs | repair proposal |
| Memory Engine | Learn preferences, brand, style, workflow, model performance | memory update |
| Proposal Bridge | Convert accepted Brain output into semantic command drafts | command proposal |

## Internal Data Flow

Input becomes intent. Intent becomes requirements. Requirements become a plan. Plan becomes provider routes. Provider routes produce candidates. Candidates pass through Guardian. Guardian either accepts, rejects, or repairs. Accepted proposals wait for user approval before becoming semantic commands.

For huge projects, input becomes a task tree first. Each branch is owned by a role, checked independently, and recomposed into one proposal package only after dependency and quality gates pass.

## Implementation Boundary

The Imagine X subsystem can be implemented as Python services, TypeScript contracts, and UI views, but its external API must remain contract-driven.

## Locked Baseline

Changes require an ADR.

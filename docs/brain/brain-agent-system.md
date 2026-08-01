# Imagine X Agent System

[Back to docs index](../README.md)

## Purpose

Define specialist agents that collaborate inside Axiom Imagine X.

## Required Agents

- Chief Director: owns final creative direction, decomposition, and approval recommendations.
- Executive Producer: converts direction into schedules, task groups, dependencies, and delivery checkpoints.
- Strategist: understands goal, audience, format, constraints, and success criteria.
- Architect: creates scene/object structure and spatial requirements.
- Senior Creative Director: defines mood, style, color, typography, lighting, rhythm, brand fit, and production quality.
- Motion Director: defines timing, pacing, keyframes, transitions, camera feel, and render intent.
- Studio Specialist: adapts plans for Photo, Vector, Motion, Video, Typography, Brand, Whiteboard, Presentation, Asset Hub, and Axiom AI.
- Provider Specialist: chooses model or tool based on capability, cost, latency, and past outcomes.
- Guardian: checks quality, exact requirements, text integrity, brand compliance, editability, and failure states.
- Repairer: proposes specific fixes when Guardian rejects output.
- Memory Curator: updates brand, style, project, creative, workflow, and model-performance memory.

## Agent Trace Requirement

Each major Imagine X output must be inspectable as a trace: who reasoned, what was decided, what alternatives were rejected, and what confidence remains.

## Work Distribution Requirement

Large requests must not be handled as one undivided prompt. Imagine X must break them into a hierarchy of director intent, executive plan, studio tasks, specialist tasks, provider jobs, Guardian checks, and final recomposition. See [Imagine X Command Hierarchy](imagine-x-command-hierarchy.md).

## Locked Baseline

Changes require an ADR.

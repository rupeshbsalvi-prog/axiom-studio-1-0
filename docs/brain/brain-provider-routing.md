# Imagine X Provider Routing

[Back to docs index](../README.md)

## Purpose

Define how Axiom Imagine X chooses the best provider, model, tool, or local engine per task.

## Routing Inputs

- Studio.
- User intent.
- Required modality.
- Output format.
- Brand constraints.
- Latency target.
- Cost sensitivity.
- Privacy mode.
- Provider availability.
- Historical model performance.

## Routing Output

The router returns provider ID, model/tool ID, confidence, expected latency, expected cost tier, reason, fallback route, and capability warnings.

## Fallback Behavior

If a provider is unavailable, unauthenticated, rate-limited, or fails quality checks, Imagine X must expose the issue and offer retry, fallback, or local/mock route depending on phase.

## Locked Baseline

Changes require an ADR.

---
Document ID: BX-SPEC-003
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Telemetry
Depends On: ADR-003
Validated By: TVR
Last Structural Change: 2026-06-21
---

# TelemetrySnapshotV1 Contract

This contract defines the pure cognitive load and consistency telemetry metrics computed synchronously by the Telemetry Engine.

## Core Interface
- `derivedState`:
  - `healthState` (`"healthy" | "attention" | "critical" | "optimal"`)
  - `nextActionConfidence`
  - `cognitiveLoadLevel` (`"low" | "medium" | "high"`)
- `productMetrics`:
  - `cts`: Explainability quality (0-100)
  - `cls`: Cognitive demand (0-100)
  - `mcs`: Model consistency score (0-100)
  - `ees`: Explanation efficiency score (0-100)

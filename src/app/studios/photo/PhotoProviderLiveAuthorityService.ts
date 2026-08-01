/**
 * Phase 28 — Photo Provider Live Authority Service
 *
 * Stateless authority evaluation layer sitting above Phase 27 readiness policy.
 * Evaluates whether a specific job+project combination is authorized for
 * live-like provider adapter boundary execution under Phase 28 rules.
 *
 * SECURITY INVARIANTS:
 *   - Phase 27 readiness policy must have passed (readinessSatisfied=true).
 *   - Phase policy must explicitly expose live execution availability.
 *   - The provider must be in the Phase 28 allowlist.
 *   - The routeId must be in the Phase 28 gateway allowlist.
 *   - The liveRuns cap must not be reached (rejection-cap enforcement).
 *   - The second-confirmation flag must be explicitly set.
 *   - Parent job security flags (providerExecuted, runtimeCodeLoaded,
 *     moduleUrlExecuted) must remain false.
 *   - This service NEVER mutates any state. Callers write liveRun records.
 */

import type { AxiomProjectDraft } from "../../projects/projectDraft";
import type { PhotoProviderReadinessReportV1 } from "./PhotoProviderReadinessPolicyTypes";
import {
  isAllowlistedProvider,
  isAllowlistedRouteId,
} from "./PhotoProviderLiveGatewayRegistry";
import { AXPKG_LIMITS } from "../../projects/axpkg/AxpkgTypes";

export interface PhotoProviderLiveAuthorityCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface PhotoProviderLiveAuthorityReport {
  /** True iff all authority checks pass and execution may proceed. */
  authorityGranted: boolean;
  checks: PhotoProviderLiveAuthorityCheck[];
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
}

export class PhotoProviderLiveAuthorityService {
  /**
   * Evaluates live-like execution authority for a given job+project.
   *
   * Rules evaluated (all must pass):
   *   1. Phase 27 readiness satisfied and live execution available
   *   2. Provider allowlisted in Phase 28
   *   3. RouteId allowlisted in Phase 28
   *   4. liveRuns cap not reached (rejection-based)
   *   5. Second-confirmation flag present
   *   6. Parent job security flags intact (providerExecuted=false, etc.)
   *   7. Job status is still "ready_for_provider_execution"
   *   8. User explicitly consented to live execution
   */
  static evaluateLiveAuthority(input: {
    project: AxiomProjectDraft;
    jobId: string;
    readinessReport: PhotoProviderReadinessReportV1;
    secondConfirmationAcknowledged: boolean;
  }): PhotoProviderLiveAuthorityReport {
    const { project, jobId, readinessReport, secondConfirmationAcknowledged } = input;

    const checks: PhotoProviderLiveAuthorityCheck[] = [];
    const diagnostics: Array<{
      severity: "info" | "warning" | "error";
      code: string;
      message: string;
    }> = [];

    // Rule 1: Phase 27 readiness satisfied and phase policy permits live execution.
    // Phase 27 readiness reports can pass as a dry readiness audit while still
    // explicitly blocking live execution; authority must honor both fields.
    const readinessPassed = readinessReport.readinessSatisfied === true;
    const phasePolicyAllowsLive =
      readinessReport.executionBlockedByPhasePolicy === false &&
      readinessReport.liveExecutionAvailable === true;
    const enablementEvidenceValid =
      readinessReport.liveEnablement?.contractVersion === "photo-provider-live-enablement.v1" &&
      readinessReport.liveEnablement.jobId === jobId &&
      readinessReport.liveEnablement.operatorAcknowledgedNetworkExecution === true;
    const readinessAndPolicyPassed = readinessPassed && phasePolicyAllowsLive && enablementEvidenceValid;
    checks.push({
      name: "Phase Readiness and Live Policy Satisfied",
      passed: readinessAndPolicyPassed,
      detail: readinessAndPolicyPassed
        ? "Readiness passed and live execution is available for this job"
        : readinessPassed
          ? "Readiness passed, but phase policy still blocks live execution"
          : "Readiness policy has not been satisfied for this job",
    });
    if (!readinessPassed) {
      diagnostics.push({
        severity: "error",
        code: "readiness_policy_not_satisfied",
        message: "Phase 27 readiness policy must be satisfied before live authority can be granted.",
      });
    }
    if (readinessPassed && !phasePolicyAllowsLive) {
      diagnostics.push({
        severity: "error",
        code: "phase_policy_blocks_live_execution",
        message:
          "Live execution is still blocked by phase policy. A readiness pass alone cannot authorize provider execution.",
      });
    }
    if (readinessPassed && phasePolicyAllowsLive && !enablementEvidenceValid) {
      diagnostics.push({
        severity: "error",
        code: "live_enablement_evidence_invalid",
        message: "Live execution requires explicit enablement evidence bound to this job.",
      });
    }

    // Locate job in project
    const jobs = project.photoProvider?.jobs ?? [];
    const job = jobs.find((j) => j.approval.approvalId === jobId);
    const jobExists = !!job;

    // Rule 2: Provider allowlisted
    const providerId = job?.adapter.providerId ?? "";
    const providerAllowlisted = jobExists && isAllowlistedProvider(providerId);
    checks.push({
      name: "Provider Adapter Allowlisted",
      passed: providerAllowlisted,
      detail: providerAllowlisted
        ? `Provider '${providerId}' is in the Phase 28 allowlist`
        : `Provider '${providerId}' is not in the Phase 28 allowlist`,
    });
    if (!providerAllowlisted) {
      diagnostics.push({
        severity: "error",
        code: "provider_not_allowlisted",
        message: `Provider '${providerId}' is not approved for live-like execution in Phase 28.`,
      });
    }

    // Rule 3: RouteId allowlisted — Phase 28 uses "photo.generate.dev" for mock-photo-provider
    const routeId = "photo.generate.dev";
    const routeAllowlisted = isAllowlistedRouteId(routeId);
    checks.push({
      name: "Gateway RouteId Allowlisted",
      passed: routeAllowlisted,
      detail: routeAllowlisted
        ? `RouteId '${routeId}' is in the Phase 28 gateway allowlist`
        : `RouteId '${routeId}' is not in the Phase 28 gateway allowlist`,
    });
    if (!routeAllowlisted) {
      diagnostics.push({
        severity: "error",
        code: "route_id_not_allowlisted",
        message: `Gateway routeId '${routeId}' is not approved for Phase 28 live-like execution.`,
      });
    }

    // Rule 4: liveRuns cap not reached (rejection-based — do not silently drop oldest)
    const liveRunCount = project.photoProvider?.liveRuns?.length ?? 0;
    const capNotReached = liveRunCount < AXPKG_LIMITS.maxPhotoProviderLiveRuns;
    checks.push({
      name: "Live Runs Cap Not Reached",
      passed: capNotReached,
      detail: capNotReached
        ? `Live run count (${liveRunCount}) is below the cap of ${AXPKG_LIMITS.maxPhotoProviderLiveRuns}`
        : `Live run cap of ${AXPKG_LIMITS.maxPhotoProviderLiveRuns} has been reached. Execution rejected.`,
    });
    if (!capNotReached) {
      diagnostics.push({
        severity: "error",
        code: "live_runs_cap_reached",
        message: `Maximum live run cap of ${AXPKG_LIMITS.maxPhotoProviderLiveRuns} has been reached. No further executions are permitted. Oldest runs are not dropped.`,
      });
    }

    // Rule 5: Second-confirmation flag present
    checks.push({
      name: "Second Confirmation Acknowledged",
      passed: secondConfirmationAcknowledged,
      detail: secondConfirmationAcknowledged
        ? "User explicitly acknowledged the second confirmation checkpoint"
        : "Second confirmation checkpoint was not acknowledged",
    });
    if (!secondConfirmationAcknowledged) {
      diagnostics.push({
        severity: "error",
        code: "second_confirmation_missing",
        message: "User must explicitly acknowledge the second confirmation before live execution.",
      });
    }

    // Rule 6: Parent job security flags intact
    const parentFlagsOk =
      jobExists &&
      job.security.providerExecuted === false &&
      job.security.runtimeCodeLoaded === false &&
      job.security.moduleUrlExecuted === false;
    checks.push({
      name: "Parent Job Security Flags Intact",
      passed: parentFlagsOk,
      detail: parentFlagsOk
        ? "All parent job execution flags are false (not mutated by Phase 28)"
        : "Parent job security flags indicate prior execution or tampering",
    });
    if (!parentFlagsOk) {
      diagnostics.push({
        severity: "error",
        code: "parent_job_flags_violated",
        message:
          "Parent job security flags (providerExecuted, runtimeCodeLoaded, moduleUrlExecuted) must remain false. Phase 28 does not mutate these flags.",
      });
    }

    // Rule 7: Job status still ready
    const statusReady = jobExists && job.status === "ready_for_provider_execution";
    checks.push({
      name: "Job Status Ready for Execution",
      passed: statusReady,
      detail: statusReady
        ? "Job status is ready_for_provider_execution"
        : `Job status is not ready (found: ${job?.status ?? "none"})`,
    });
    if (!statusReady) {
      diagnostics.push({
        severity: "error",
        code: "job_status_not_ready",
        message: "Job must be in 'ready_for_provider_execution' status for live authority to be granted.",
      });
    }

    // Rule 8: User consent for provider execution
    const userConsent = jobExists && job.approval.userConfirmedProviderExecution === true;
    checks.push({
      name: "User Consent for Provider Execution",
      passed: userConsent,
      detail: userConsent
        ? "User confirmed provider execution is set to true"
        : "User consent for provider execution is not set",
    });
    if (!userConsent) {
      diagnostics.push({
        severity: "error",
        code: "user_consent_missing",
        message: "User consent (userConfirmedProviderExecution) must be explicitly set.",
      });
    }

    const authorityGranted =
      readinessAndPolicyPassed &&
      providerAllowlisted &&
      routeAllowlisted &&
      capNotReached &&
      secondConfirmationAcknowledged &&
      parentFlagsOk &&
      statusReady &&
      userConsent;

    return { authorityGranted, checks, diagnostics };
  }
}

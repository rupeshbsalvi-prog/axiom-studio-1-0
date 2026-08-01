export interface ComplianceResult {
  status: "PASS" | "WARNING" | "CRITICAL";
  severity: number; // 0 = Pass, 1 = Warning, 2 = Critical
  message: string;
  metric: string;
  threshold: number;
  actual: number;
}

export interface ComplianceRule {
  metric: string;
  warningThreshold: number;
  criticalThreshold: number;
  comparison: "lessThan" | "greaterThan";
  message: string;
}

export class ComplianceService {
  private rules: ComplianceRule[] = [
    {
      metric: "fps",
      warningThreshold: 58,
      criticalThreshold: 50,
      comparison: "lessThan",
      message: "Frame rate has dropped below stable threshold.",
    },
    {
      metric: "drawCalls",
      warningThreshold: 8,
      criticalThreshold: 12,
      comparison: "greaterThan",
      message: "Draw call count exceeds performance budget.",
    },
    {
      metric: "gpuTime",
      warningThreshold: 2.0,
      criticalThreshold: 4.0,
      comparison: "greaterThan",
      message: "GPU render pass execution time is elevated.",
    },
    {
      metric: "cpuTime",
      warningThreshold: 1.0,
      criticalThreshold: 2.0,
      comparison: "greaterThan",
      message: "CPU frame state compute time exceeds budget.",
    },
    {
      metric: "gpuMemory",
      warningThreshold: 64.0,
      criticalThreshold: 96.0,
      comparison: "greaterThan",
      message: "GPU geometry buffer size is approaching limits.",
    },
  ];

  registerRule(rule: ComplianceRule): void {
    this.rules = this.rules.filter((r) => r.metric !== rule.metric);
    this.rules.push(rule);
  }

  evaluate(metrics: Record<string, any>): ComplianceResult[] {
    const results: ComplianceResult[] = [];

    for (const rule of this.rules) {
      const actual = metrics[rule.metric];
      if (actual === undefined) continue;

      let status: "PASS" | "WARNING" | "CRITICAL" = "PASS";
      let severity = 0;
      let threshold = 0;

      if (rule.comparison === "lessThan") {
        if (actual < rule.criticalThreshold) {
          status = "CRITICAL";
          severity = 2;
          threshold = rule.criticalThreshold;
        } else if (actual < rule.warningThreshold) {
          status = "WARNING";
          severity = 1;
          threshold = rule.warningThreshold;
        }
      } else {
        if (actual > rule.criticalThreshold) {
          status = "CRITICAL";
          severity = 2;
          threshold = rule.criticalThreshold;
        } else if (actual > rule.warningThreshold) {
          status = "WARNING";
          severity = 1;
          threshold = rule.warningThreshold;
        }
      }

      results.push({
        status,
        severity,
        message: status === "PASS" ? `Metric is within bounds.` : rule.message,
        metric: rule.metric,
        threshold,
        actual,
      });
    }

    return results;
  }

  getOverallStatus(results: ComplianceResult[]): {
    status: "PASS" | "WARNING" | "CRITICAL";
    severity: number;
  } {
    let maxSeverity = 0;
    let overallStatus: "PASS" | "WARNING" | "CRITICAL" = "PASS";

    for (const result of results) {
      if (result.severity > maxSeverity) {
        maxSeverity = result.severity;
        overallStatus = result.status;
      }
    }

    return { status: overallStatus, severity: maxSeverity };
  }
}

export const complianceService = new ComplianceService();

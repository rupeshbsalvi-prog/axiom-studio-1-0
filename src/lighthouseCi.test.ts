import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Lighthouse CI", () => {
  it("enforces repeatable mobile performance budgets on pull requests", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const config = JSON.parse(readFileSync("lighthouserc.json", "utf8"));
    const workflow = readFileSync(".github/workflows/lighthouse.yml", "utf8");
    const assertions = config.ci.assert.assertions;

    expect(packageJson.scripts["lighthouse:ci"]).toBe("npx --yes @lhci/cli@0.15.1 autorun");
    expect(config.ci.collect.staticDistDir).toBe("./dist");
    expect(config.ci.collect.numberOfRuns).toBeGreaterThanOrEqual(3);
    expect(assertions["largest-contentful-paint"][1].maxNumericValue).toBeLessThanOrEqual(2500);
    expect(assertions["cumulative-layout-shift"][1].maxNumericValue).toBeLessThanOrEqual(0.1);
    expect(assertions["total-blocking-time"][1].maxNumericValue).toBeLessThanOrEqual(300);
    expect(assertions["total-byte-weight"][1].maxNumericValue).toBeLessThanOrEqual(2_000_000);
    expect(config.ci.upload.target).toBe("filesystem");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("npm run lighthouse:ci");
  });
});

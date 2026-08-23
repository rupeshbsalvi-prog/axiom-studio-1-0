import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Axiom public typeface program", () => {
  it("defines a license-safe production brief before font files are published", () => {
    const brief = readFileSync("creative/brand-system/docs/axiom-typeface-brief.md", "utf8");

    expect(brief).toMatch(/SIL Open Font License/i);
    expect(brief).toMatch(/Space Grotesk 2\.0/i);
    expect(brief).toMatch(/Gate 1.*approved/i);
    expect(brief).toMatch(/floriankarsten\/space-grotesk/i);
    expect(brief).toMatch(/Axiom Sans/i);
    expect(brief).toMatch(/Latin Extended/i);
    expect(brief).toMatch(/accessibility/i);
    expect(brief).toMatch(/no font binary is approved/i);
  });
});

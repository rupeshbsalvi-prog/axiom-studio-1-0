import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Variant = "signature" | "lockup" | "appIcon" | "micro";

const manifestPath = resolve(
  process.cwd(),
  "creative/brand-system/config/logo-l1c.manifest.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  direction: string;
  status: string;
  supersedesCandidate: string;
  variants: Record<Variant, string>;
  motionGroups: string[];
};

function readVariant(variant: Variant): { svg: string; size: number } {
  const assetPath = resolve(
    process.cwd(),
    "creative/brand-system/config",
    manifest.variants[variant],
  );
  return { svg: readFileSync(assetPath, "utf8"), size: statSync(assetPath).size };
}

describe("Logo System L1C", () => {
  it("defines the precision ribbon direction without promoting it", () => {
    expect(manifest.direction).toBe("precision-ribbon-a");
    expect(manifest.status).toBe("candidate");
    expect(manifest.supersedesCandidate).toBe("logo-l1b");
    expect(Object.keys(manifest.variants)).toEqual([
      "signature",
      "lockup",
      "appIcon",
      "micro",
    ]);
  });

  it("keeps every variant local, accessible, and raster-free", () => {
    for (const variant of Object.keys(manifest.variants) as Variant[]) {
      expect(manifest.variants[variant]).toMatch(
        /^\.\.\/assets\/logos\/l1c\/[a-z0-9-]+\.svg$/,
      );
      const { svg } = readVariant(variant);
      expect(svg).toContain("<title>");
      expect(svg).toContain("<metadata>");
      expect(svg).not.toContain("<image");
      expect(svg).not.toMatch(/(?:href|src)="https?:\/\//);
    }
  });

  it("provides a detailed signature with explicit motion groups", () => {
    const { svg, size } = readVariant("signature");
    expect(size).toBeGreaterThan(6_000);
    expect(size).toBeLessThan(36_000);
    expect((svg.match(/(?:linear|radial)Gradient/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect(svg).toContain("<filter");

    expect(manifest.motionGroups).toEqual([
      "ribbon-left",
      "ribbon-crown",
      "ribbon-right",
      "prism-core",
      "energy-orbits",
      "surface-highlights",
    ]);
    for (const group of manifest.motionGroups) {
      expect(svg).toContain(`id="${group}"`);
    }
  });

  it("uses outlined geometry for the portable wordmark lockup", () => {
    const { svg } = readVariant("lockup");
    expect(svg).toContain('aria-label="Axiom Studio"');
    expect(svg).toContain('data-wordmark="outlined"');
    expect(svg).not.toContain("<text");
  });

  it("keeps the micro mark fast and legible", () => {
    const { svg, size } = readVariant("micro");
    expect(size).toBeLessThan(3_500);
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).not.toContain("Gradient");
    expect(svg).not.toContain("<filter");
    expect(svg).not.toContain("<mask");
  });
});

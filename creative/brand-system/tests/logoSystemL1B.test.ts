import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Tier = "hero" | "standard" | "micro";
type Identity = {
  id: string;
  name: string;
  variants: Record<Tier, string>;
};

const manifestPath = resolve(
  process.cwd(),
  "creative/brand-system/config/logo-l1b.manifest.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  direction: string;
  status: string;
  identities: Identity[];
};

const tiers: Tier[] = ["hero", "standard", "micro"];
const sizeBudgets: Record<Tier, number> = {
  hero: 24_000,
  standard: 12_000,
  micro: 4_000,
};

describe("Logo System L1B", () => {
  it("defines the approved prototype scope without replacing L1", () => {
    expect(manifest.direction).toBe("expressive-a-emblem");
    expect(manifest.status).toBe("candidate");
    expect(manifest.identities.map(({ id }) => id)).toEqual([
      "axiom-studio",
      "brain-x",
      "imagine-x",
    ]);
  });

  it("provides hero, standard, and micro SVGs for every prototype", () => {
    for (const identity of manifest.identities) {
      expect(Object.keys(identity.variants)).toEqual(tiers);

      for (const tier of tiers) {
        const relativePath = identity.variants[tier];
        expect(relativePath).toMatch(/^\.\.\/assets\/logos\/l1b\/[a-z0-9-]+\.svg$/);
        const assetPath = resolve(
          process.cwd(),
          "creative/brand-system/config",
          relativePath,
        );
        const svg = readFileSync(assetPath, "utf8");

        expect(statSync(assetPath).size).toBeLessThan(sizeBudgets[tier]);
        expect(svg).toContain('viewBox="0 0 256 256"');
        expect(svg).toContain('data-family="axiom-a"');
        expect(svg).toContain(`data-tier="${tier}"`);
        expect(svg).toContain("<title>");
        expect(svg).toContain("<metadata>");
        expect(svg).not.toContain("<image");
        expect(svg).not.toContain("<text");
        expect(svg).not.toMatch(/(?:href|src)="https?:\/\//);
      }
    }
  });

  it("keeps micro marks filter-free and suitable for small UI", () => {
    for (const identity of manifest.identities) {
      const microPath = resolve(
        process.cwd(),
        "creative/brand-system/config",
        identity.variants.micro,
      );
      const micro = readFileSync(microPath, "utf8");
      expect(micro).not.toContain("<filter");
      expect(micro).not.toContain("Gradient");
      expect(micro).not.toContain("<mask");
    }
  });
});

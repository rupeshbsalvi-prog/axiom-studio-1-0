import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const manifestPath = resolve(
  process.cwd(),
  "creative/brand-system/config/logo.manifest.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  version: string;
  status: string;
  identities: Array<{
    id: string;
    name: string;
    role: string;
    accent: string;
    symbol: string;
  }>;
};

const expectedIdentities = [
  "axiom-studio",
  "brain-x",
  "imagine-x",
  "photo-studio",
  "vector-studio",
  "brand-studio",
  "asset-hub",
  "ui-ux-studio",
  "typography-studio",
  "presentation-studio",
  "motion-studio",
  "video-studio",
  "whiteboard-studio",
];

describe("Logo System L1", () => {
  it("defines the complete governed identity family", () => {
    expect(manifest.status).toBe("candidate");
    expect(manifest.identities.map(({ id }) => id)).toEqual(expectedIdentities);
  });

  it("uses unique, local, accessible SVG symbols", () => {
    const symbols = new Set<string>();

    for (const identity of manifest.identities) {
      expect(identity.symbol).toMatch(/^\.\.\/assets\/logos\/[a-z0-9-]+\.svg$/);
      expect(symbols.has(identity.symbol)).toBe(false);
      symbols.add(identity.symbol);

      const svgPath = resolve(
        process.cwd(),
        "creative/brand-system/config",
        identity.symbol,
      );
      const svg = readFileSync(svgPath, "utf8");
      expect(svg).toContain('viewBox="0 0 64 64"');
      expect(svg).toContain("<title>");
      expect(svg).toContain("<metadata>");
      expect(svg).not.toContain("<text");
      expect(svg).not.toMatch(/(?:href|src)="https?:\/\//);
    }
  });

  it("keeps the master mark neutral and intelligence accents distinct", () => {
    const byId = Object.fromEntries(
      manifest.identities.map((identity) => [identity.id, identity]),
    );

    expect(byId["axiom-studio"].accent).toBe("paper");
    expect(byId["brain-x"].accent).toBe("violet");
    expect(byId["imagine-x"].accent).toBe("amber");
  });
});

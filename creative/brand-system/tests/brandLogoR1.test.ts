import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type RasterAsset = {
  id: string;
  path: string;
  width: number;
  height: number;
  format: "png" | "webp";
};

const manifestPath = resolve(
  process.cwd(),
  "creative/brand-system/config/brand-logo-r1.manifest.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  status: string;
  source: string;
  replacesCandidate: string;
  rasterAssets: RasterAsset[];
  microMark: string;
};

const assetsRoot = resolve(process.cwd(), "creative/brand-system/config");

describe("Brand Logo R1", () => {
  it("keeps the PNG-derived direction gated as a candidate", () => {
    expect(manifest.status).toBe("candidate");
    expect(manifest.source).toBe("ChatGPT Image Aug 9, 2026, 06_07_04 PM.png");
    expect(manifest.replacesCandidate).toBe("logo-l1c");
  });

  it("defines the responsive raster asset ladder", () => {
    expect(manifest.rasterAssets.map(({ id, width, format }) => ({ id, width, format }))).toEqual([
      { id: "master", width: 4096, format: "png" },
      { id: "hero", width: 2048, format: "webp" },
      { id: "display", width: 1024, format: "webp" },
      { id: "ui", width: 512, format: "webp" },
      { id: "app-icon", width: 512, format: "png" },
    ]);
  });

  it("ships local non-empty raster files at their declared dimensions", () => {
    for (const asset of manifest.rasterAssets) {
      expect(asset.path).toMatch(/^\.\.\/assets\/logos\/r1\/[a-z0-9-]+\.(?:png|webp)$/);
      const path = resolve(assetsRoot, asset.path);
      const bytes = readFileSync(path);
      expect(statSync(path).size).toBeGreaterThan(1_000);

      if (asset.format === "png") {
        expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
        expect(bytes.readUInt32BE(16)).toBe(asset.width);
        expect(bytes.readUInt32BE(20)).toBe(asset.height);
        expect([4, 6]).toContain(bytes[25]);
      } else {
        expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
        expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
      }
    }
  });

  it("retains a lightweight SVG only for micro UI", () => {
    expect(manifest.microMark).toBe("../assets/logos/l1c/axiom-micro.svg");
  });
});

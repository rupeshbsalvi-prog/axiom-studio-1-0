// @vitest-environment node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exportAxiomCoreAssets } from "./axiom-core-export";

describe("Axiom Core GLB export", () => {
  it("writes valid binary glTF files within each delivery budget", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "axiom-core-export-"));

    try {
      const manifest = await exportAxiomCoreAssets(outputDirectory);

      expect(manifest.formats).toEqual(["glb", "usdz"]);
      expect(manifest.runtimeValidation).toEqual({
        passed: true,
        scope: "loader-and-budget",
        fpsMeasured: false,
        loaders: ["GLTFLoader", "USDLoader"],
        tiers: [
          { tier: "hero", glbMeshes: 3, usdzMeshes: 3, animations: 1 },
          { tier: "runtime", glbMeshes: 3, usdzMeshes: 3, animations: 1 },
          { tier: "mobile", glbMeshes: 3, usdzMeshes: 3, animations: 1 },
        ],
      });
      expect(manifest.assets).toHaveLength(3);
      for (const asset of manifest.assets) {
        const file = await readFile(join(outputDirectory, asset.file));
        expect(file.subarray(0, 4).toString("ascii")).toBe("glTF");
        const jsonChunkLength = file.readUInt32LE(12);
        const gltf = JSON.parse(file.subarray(20, 20 + jsonChunkLength).toString("utf8"));
        expect(gltf.animations).toHaveLength(1);
        expect(gltf.animations[0].name).toBe("idle-breathe");
        expect(file.byteLength).toBe(asset.bytes);
        expect(asset.metrics.drawCalls).toBeLessThan(10);
        expect(asset.metrics.triangles).toBeLessThan(25_000);
        expect(asset.metrics.textureBytes).toBe(0);

        const byteBudget = asset.tier === "hero" ? 5_000_000 : 1_000_000;
        expect(asset.bytes).toBeLessThanOrEqual(byteBudget);

        const usdz = await readFile(join(outputDirectory, asset.usdzFile));
        expect(usdz.subarray(0, 2).toString("ascii")).toBe("PK");
        expect(usdz.includes(Buffer.from("model.usda"))).toBe(true);
        expect(usdz.byteLength).toBe(asset.usdzBytes);
        expect(asset.usdzBytes, `${asset.tier} USDZ budget`).toBeLessThanOrEqual(1_800_000);
      }
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});

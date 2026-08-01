import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  AXIOM_CORE_TIERS,
  buildAxiomCoreAsset,
  createAxiomCoreMaterial,
  measureAxiomCoreAsset,
  qualityToAxiomCoreTier,
} from "./axiomCoreGeometry";

describe("Axiom Core production geometry", () => {
  it("maps runtime quality levels to delivery tiers", () => {
    expect(["high", "medium", "low"].map((quality) =>
      qualityToAxiomCoreTier(quality as "high" | "medium" | "low"),
    )).toEqual(["hero", "runtime", "mobile"]);
  });

  it("keeps every tier within the production budgets", () => {
    const results = AXIOM_CORE_TIERS.map((tier) => {
      const asset = buildAxiomCoreAsset(tier);
      const metrics = measureAxiomCoreAsset(asset);

      expect(asset.name).toBe("AXIOM_CORE");
      expect(asset.children.map((child) => child.name)).toEqual([
        "OPTICAL_SHELL",
        "CRYSTAL_SEED",
        "QUANTUM_CORE",
      ]);
      expect(
        asset.children.map((child) =>
          (child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>).material.name
        ),
      ).toEqual([
        "AX-MAT-001_GLASS",
        "AX-MAT-002_CRYSTAL",
        "AX-MAT-005_TITANIUM",
      ]);
      expect(metrics.drawCalls).toBeLessThan(10);
      expect(metrics.triangles).toBeLessThan(25_000);
      expect(metrics.textureBytes).toBe(0);
      asset.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const normals = object.geometry.getAttribute("normal");
        for (let index = 0; index < normals.count; index += 1) {
          const length = Math.hypot(
            normals.getX(index),
            normals.getY(index),
            normals.getZ(index),
          );
          expect(length).toBeGreaterThan(0.99);
        }
      });

      return metrics;
    });

    expect(results[0].triangles).toBeGreaterThan(results[1].triangles);
    expect(results[1].triangles).toBeGreaterThan(results[2].triangles);
  });
});

describe("Axiom Core material system", () => {
  it("provides the five reusable production material families", () => {
    const materials = [
      createAxiomCoreMaterial("glass"),
      createAxiomCoreMaterial("crystal"),
      createAxiomCoreMaterial("neuralEnergy"),
      createAxiomCoreMaterial("holographic"),
      createAxiomCoreMaterial("titanium"),
    ];

    expect(materials.map((material) => material.name)).toEqual([
      "AX-MAT-001_GLASS",
      "AX-MAT-002_CRYSTAL",
      "AX-MAT-003_NEURAL_ENERGY",
      "AX-MAT-004_HOLOGRAPHIC",
      "AX-MAT-005_TITANIUM",
    ]);
    expect(materials.every((material) => material.map === null)).toBe(true);

    const [glass, crystal, neuralEnergy, holographic, titanium] = materials;
    expect(glass).toMatchObject({ transmission: 1, ior: 1.52, roughness: 0.035 });
    expect(crystal).toMatchObject({ metalness: 0.35, emissiveIntensity: 0.85 });
    expect(neuralEnergy).toMatchObject({ emissiveIntensity: 1.5, transparent: true });
    expect(holographic).toMatchObject({ transparent: true, opacity: 0.32 });
    expect(titanium).toMatchObject({ metalness: 0.92, roughness: 0.22 });

    materials.forEach((material) => material.dispose());
  });
});

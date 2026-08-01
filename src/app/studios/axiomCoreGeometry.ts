import * as THREE from "three";

export const AXIOM_CORE_TIERS = ["hero", "runtime", "mobile"] as const;
export type AxiomCoreTier = (typeof AXIOM_CORE_TIERS)[number];

export function qualityToAxiomCoreTier(
  quality: "high" | "medium" | "low",
): AxiomCoreTier {
  return quality === "high" ? "hero" : quality === "medium" ? "runtime" : "mobile";
}

const TIER_DETAIL: Record<
  AxiomCoreTier,
  { shellSegments: number; crystalDetail: number; coreSegments: number }
> = {
  hero: { shellSegments: 32, crystalDetail: 3, coreSegments: 24 },
  runtime: { shellSegments: 16, crystalDetail: 2, coreSegments: 16 },
  mobile: { shellSegments: 8, crystalDetail: 1, coreSegments: 8 },
};

export const AXIOM_CORE_DIMENSIONS = {
  shellRadius: 1.2,
  crystalRadius: 0.85,
  quantumCoreRadius: 0.12,
  imperfectionFrequency: 3.5,
  imperfectionScale: 0.04,
} as const;

export type AxiomCoreMaterialKind =
  | "glass"
  | "crystal"
  | "neuralEnergy"
  | "holographic"
  | "titanium";

export const AXIOM_CORE_MATERIAL_VALUES = {
  glass: { ior: 1.52, roughness: 0.035, transmission: 1, thickness: 0.5 },
  crystal: { ior: 1.7, roughness: 0.15, metalness: 0.35, emissiveIntensity: 0.85 },
  neuralEnergy: { roughness: 0.2, emissiveIntensity: 1.5, opacity: 0.78 },
  holographic: { roughness: 0.08, transmission: 0.72, opacity: 0.32 },
  titanium: { roughness: 0.22, metalness: 0.92 },
} as const;

export function createAxiomCoreMaterial(
  kind: AxiomCoreMaterialKind,
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  let material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

  switch (kind) {
    case "glass":
      material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        ...AXIOM_CORE_MATERIAL_VALUES.glass,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      material.name = "AX-MAT-001_GLASS";
      break;
    case "crystal":
      material = new THREE.MeshPhysicalMaterial({
        color: 0x69d4e8,
        emissive: 0x163f49,
        ...AXIOM_CORE_MATERIAL_VALUES.crystal,
        flatShading: true,
      });
      material.name = "AX-MAT-002_CRYSTAL";
      break;
    case "neuralEnergy":
      material = new THREE.MeshStandardMaterial({
        color: 0x69d4e8,
        emissive: 0x69d4e8,
        ...AXIOM_CORE_MATERIAL_VALUES.neuralEnergy,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      material.name = "AX-MAT-003_NEURAL_ENERGY";
      break;
    case "holographic":
      material = new THREE.MeshPhysicalMaterial({
        color: 0x9ee9f5,
        ...AXIOM_CORE_MATERIAL_VALUES.holographic,
        transparent: true,
        depthWrite: false,
        iridescence: 1,
      });
      material.name = "AX-MAT-004_HOLOGRAPHIC";
      break;
    case "titanium":
      material = new THREE.MeshStandardMaterial({
        color: 0xb8bec7,
        emissive: 0x2f281d,
        emissiveIntensity: 0.35,
        ...AXIOM_CORE_MATERIAL_VALUES.titanium,
      });
      material.name = "AX-MAT-005_TITANIUM";
      break;
  }

  return material;
}

function applyShellImperfections(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const noise =
      Math.sin(vertex.x * AXIOM_CORE_DIMENSIONS.imperfectionFrequency) *
      Math.cos(vertex.y * AXIOM_CORE_DIMENSIONS.imperfectionFrequency) *
      AXIOM_CORE_DIMENSIONS.imperfectionScale;
    vertex.addScaledVector(vertex.clone().normalize(), noise);
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.normalizeNormals();

  const normal = geometry.getAttribute("normal");
  for (let index = 0; index < normal.count; index += 1) {
    vertex.fromBufferAttribute(normal, index);
    if (vertex.lengthSq() > Number.EPSILON) continue;
    vertex.fromBufferAttribute(position, index).normalize();
    normal.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  normal.needsUpdate = true;
}

export function createAxiomCoreShellGeometry(tier: AxiomCoreTier): THREE.SphereGeometry {
  const segments = TIER_DETAIL[tier].shellSegments;
  const geometry = new THREE.SphereGeometry(
    AXIOM_CORE_DIMENSIONS.shellRadius,
    segments,
    segments,
  );
  applyShellImperfections(geometry);
  return geometry;
}

export function createAxiomCoreCrystalGeometry(tier: AxiomCoreTier): THREE.IcosahedronGeometry {
  return new THREE.IcosahedronGeometry(
    AXIOM_CORE_DIMENSIONS.crystalRadius,
    TIER_DETAIL[tier].crystalDetail,
  );
}

export function createAxiomCoreQuantumGeometry(tier: AxiomCoreTier): THREE.SphereGeometry {
  const segments = TIER_DETAIL[tier].coreSegments;
  return new THREE.SphereGeometry(
    AXIOM_CORE_DIMENSIONS.quantumCoreRadius,
    segments,
    segments,
  );
}

export function buildAxiomCoreAsset(tier: AxiomCoreTier): THREE.Group {
  const root = new THREE.Group();
  root.name = "AXIOM_CORE";
  root.userData = { assetId: "ax-core-001", tier };

  const shell = new THREE.Mesh(
    createAxiomCoreShellGeometry(tier),
    createAxiomCoreMaterial("glass"),
  );
  shell.name = "OPTICAL_SHELL";

  const crystal = new THREE.Mesh(
    createAxiomCoreCrystalGeometry(tier),
    createAxiomCoreMaterial("crystal"),
  );
  crystal.name = "CRYSTAL_SEED";

  const quantumCore = new THREE.Mesh(
    createAxiomCoreQuantumGeometry(tier),
    createAxiomCoreMaterial("titanium"),
  );
  quantumCore.name = "QUANTUM_CORE";

  root.add(shell, crystal, quantumCore);
  return root;
}

export interface AxiomCoreMetrics {
  drawCalls: number;
  triangles: number;
  textureBytes: number;
}

export function measureAxiomCoreAsset(asset: THREE.Object3D): AxiomCoreMetrics {
  let drawCalls = 0;
  let triangles = 0;

  asset.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    drawCalls += Array.isArray(object.material) ? object.material.length : 1;
    const index = object.geometry.getIndex();
    triangles += index
      ? index.count / 3
      : object.geometry.getAttribute("position").count / 3;
  });

  return { drawCalls, triangles, textureBytes: 0 };
}

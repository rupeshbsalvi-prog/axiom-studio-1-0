import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";
import {
  AXIOM_CORE_TIERS,
  buildAxiomCoreAsset,
  measureAxiomCoreAsset,
  type AxiomCoreMetrics,
  type AxiomCoreTier,
} from "../src/app/studios/axiomCoreGeometry.ts";

interface ExportedAxiomCoreAsset {
  tier: AxiomCoreTier;
  file: string;
  bytes: number;
  usdzFile: string;
  usdzBytes: number;
  metrics: AxiomCoreMetrics;
}

export interface AxiomCoreManifest {
  assetId: "ax-core-001";
  source: "src/app/studios/axiomCoreGeometry.ts";
  animation: "idle-breathe";
  formats: ["glb", "usdz"];
  runtimeValidation: {
    passed: true;
    scope: "loader-and-budget";
    fpsMeasured: false;
    loaders: ["GLTFLoader", "USDLoader"];
    tiers: Array<{
      tier: AxiomCoreTier;
      glbMeshes: number;
      usdzMeshes: number;
      animations: number;
    }>;
  };
  assets: ExportedAxiomCoreAsset[];
}

class NodeFileReader {
  result: ArrayBuffer | string | null = null;
  onloadend: (() => void) | null = null;

  readAsArrayBuffer(blob: Blob): void {
    void blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob: Blob): void {
    void blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString("base64")}`;
      this.onloadend?.();
    });
  }
}

function ensureNodeFileReader(): void {
  if (typeof globalThis.FileReader === "undefined") {
    Object.assign(globalThis, { FileReader: NodeFileReader });
  }
}

function createIdleAnimation(): THREE.AnimationClip {
  return new THREE.AnimationClip("idle-breathe", 8, [
    new THREE.QuaternionKeyframeTrack(
      "CRYSTAL_SEED.quaternion",
      [0, 4, 8],
      [
        0, 0, 0, 1,
        0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8),
        0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4),
      ],
    ),
    new THREE.VectorKeyframeTrack(
      "QUANTUM_CORE.scale",
      [0, 4, 8],
      [1, 1, 1, 1.08, 1.08, 1.08, 1, 1, 1],
    ),
  ]);
}

async function exportGlb(asset: THREE.Object3D): Promise<ArrayBuffer> {
  ensureNodeFileReader();
  const result = await new GLTFExporter().parseAsync(asset, {
    binary: true,
    animations: [createIdleAnimation()],
    onlyVisible: true,
  });

  if (!(result instanceof ArrayBuffer)) {
    throw new Error("Axiom Core export did not produce a binary glTF payload.");
  }
  return result;
}

async function exportUsdz(asset: THREE.Object3D): Promise<ArrayBuffer> {
  return new USDZExporter().parseAsync(asset, { quickLookCompatible: true });
}

function countMeshes(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) count += 1;
  });
  return count;
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

async function loadGlb(buffer: Buffer): Promise<GLTF> {
  return new Promise((resolveLoad, rejectLoad) => {
    new GLTFLoader().parse(toArrayBuffer(buffer), "", resolveLoad, rejectLoad);
  });
}

async function validateRuntimeExports(
  outputDirectory: string,
  assets: ExportedAxiomCoreAsset[],
): Promise<AxiomCoreManifest["runtimeValidation"]> {
  const tiers = [];

  for (const asset of assets) {
    const gltf = await loadGlb(await readFile(join(outputDirectory, asset.file)));
    const usdz = new USDLoader().parse(
      toArrayBuffer(await readFile(join(outputDirectory, asset.usdzFile))),
    );
    const result = {
      tier: asset.tier,
      glbMeshes: countMeshes(gltf.scene),
      usdzMeshes: countMeshes(usdz),
      animations: gltf.animations.length,
    };
    if (result.glbMeshes !== 3 || result.usdzMeshes !== 3 || result.animations !== 1) {
      throw new Error(`Axiom Core ${asset.tier} failed runtime compatibility validation.`);
    }
    tiers.push(result);
  }

  if (!(assets[0].metrics.triangles > assets[1].metrics.triangles &&
        assets[1].metrics.triangles > assets[2].metrics.triangles)) {
    throw new Error("Axiom Core tiers do not degrade strictly from hero to mobile.");
  }

  return {
    passed: true,
    scope: "loader-and-budget",
    fpsMeasured: false,
    loaders: ["GLTFLoader", "USDLoader"],
    tiers,
  };
}

export async function exportAxiomCoreAssets(
  outputDirectory: string,
): Promise<AxiomCoreManifest> {
  await mkdir(outputDirectory, { recursive: true });
  const assets: ExportedAxiomCoreAsset[] = [];

  for (const tier of AXIOM_CORE_TIERS) {
    const asset = buildAxiomCoreAsset(tier);
    const metrics = measureAxiomCoreAsset(asset);
    const usdz = await exportUsdz(asset);
    const glb = await exportGlb(asset);
    const file = `ax-core-${tier}.glb`;
    const usdzFile = `ax-core-${tier}.usdz`;
    await writeFile(join(outputDirectory, file), Buffer.from(glb));
    await writeFile(join(outputDirectory, usdzFile), Buffer.from(usdz));
    assets.push({
      tier,
      file,
      bytes: glb.byteLength,
      usdzFile,
      usdzBytes: usdz.byteLength,
      metrics,
    });

    asset.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
  }

  const runtimeValidation = await validateRuntimeExports(outputDirectory, assets);
  const manifest: AxiomCoreManifest = {
    assetId: "ax-core-001",
    source: "src/app/studios/axiomCoreGeometry.ts",
    animation: "idle-breathe",
    formats: ["glb", "usdz"],
    runtimeValidation,
    assets,
  };
  await writeFile(
    join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedFile === currentFile) {
  const projectRoot = resolve(dirname(currentFile), "..");
  const outputDirectory = join(projectRoot, "creative", "axiom-core", "exports");
  const manifest = await exportAxiomCoreAssets(outputDirectory);
  for (const asset of manifest.assets) {
    console.log(
      `${asset.file}: ${asset.bytes} bytes; ${asset.usdzFile}: ${asset.usdzBytes} bytes; ${asset.metrics.triangles} triangles, ${asset.metrics.drawCalls} draw calls`,
    );
  }
  console.log(pathToFileURL(outputDirectory).href);
}

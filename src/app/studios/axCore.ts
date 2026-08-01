import * as THREE from "three";
import {
  AXIOM_CORE_DIMENSIONS,
  AXIOM_CORE_MATERIAL_VALUES,
  createAxiomCoreCrystalGeometry,
  createAxiomCoreMaterial,
  createAxiomCoreQuantumGeometry,
  createAxiomCoreShellGeometry,
  qualityToAxiomCoreTier,
} from "./axiomCoreGeometry";

// ----------------------------------------------------
// 1. Core Config Registry (AXCoreConfig)
// ----------------------------------------------------
export const AXCoreConfig = {
  geometry: {
    shellRadius: AXIOM_CORE_DIMENSIONS.shellRadius,
    crystalRadius: AXIOM_CORE_DIMENSIONS.crystalRadius,
    imperfectionFrequency: AXIOM_CORE_DIMENSIONS.imperfectionFrequency,
    imperfectionScale: AXIOM_CORE_DIMENSIONS.imperfectionScale,
    activeVariant: "B" as "A" | "B" | "C", // Evaluated variants A, B, and C
  },
  lighting: {
    keyColor: 0x69d4e8,
    fillColor: 0x111318,
    accentColor: 0xedd095,
    keyIntensity: 2.8,
    fillIntensity: 0.42,
    accentIntensity: 1.5,
    rimWeight: 1.0,
    volumetricFillSubtle: 0.1,
  },
  materials: {
    glass: {
      ior: AXIOM_CORE_MATERIAL_VALUES.glass.ior,
      roughness: AXIOM_CORE_MATERIAL_VALUES.glass.roughness,
      metalness: 0.0,
      transmission: AXIOM_CORE_MATERIAL_VALUES.glass.transmission,
      thickness: AXIOM_CORE_MATERIAL_VALUES.glass.thickness,
    },
    crystal: {
      ...AXIOM_CORE_MATERIAL_VALUES.crystal,
    },
    energy: {
      baseIntensity: 0.45,
      maxIntensity: 2.0,
    },
  },
  particles: {
    maxCount: 800,
    baseSize: 0.035,
  },
  lod: {
    high: { particles: 800, segments: 32 },
    medium: { particles: 400, segments: 16 },
    low: { particles: 100, segments: 8 },
  },
};

import {
  AXIOM_CORE_LIFECYCLE_STATES,
  type AxiomCoreLifecycleState,
  type AXRuntimeStateData,
  type AXFrameState,
} from "../../platform/runtime/FrameState";
export {
  AXIOM_CORE_LIFECYCLE_STATES,
  type AxiomCoreLifecycleState,
  type AXRuntimeStateData,
  type AXFrameState,
} from "../../platform/runtime/FrameState";
import { type RuntimeContext } from "../../platform/runtime/RuntimeContext";
import { platformRuntime } from "../../platform/runtime/PlatformRuntime";

export type AXRenderContext = RuntimeContext;

export interface AXCoreModule {
  initialize(context: AXRenderContext): Promise<void> | void;
  update(state: AXFrameState, deltaTime: number): void;
  dispose(): void;
}

// ----------------------------------------------------
// 2b. Canonical Shader & Material Registry (v1 Platform Assets)
// ----------------------------------------------------
export const AXShaderRegistry = {
  glass: {
    id: "AX-SHD-001",
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float ior;
      uniform float roughness;
      uniform float transmission;
      uniform float opaqueMode;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0) * (1.0 - roughness);
        vec3 glassRefraction = mix(color * 0.1, vec3(1.0), fresnel);
        float alphaVal = mix(transmission * (0.15 + fresnel * 0.85), 1.0, opaqueMode);
        gl_FragColor = vec4(glassRefraction, alphaVal);
      }
    `,
  },
  crystal: {
    id: "AX-SHD-003",
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vEyeVector;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vEyeVector = normalize(worldPosition.xyz - cameraPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 emissive;
      uniform float emissiveIntensity;
      uniform float ior;
      uniform float opaqueMode;
      varying vec3 vNormal;
      varying vec3 vEyeVector;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 eye = normalize(vEyeVector);
        float reflection = pow(1.0 - max(dot(normal, -eye), 0.0), 3.0);
        vec3 prismaticColor = emissive * (emissiveIntensity + reflection * ior * 0.5);
        float alphaVal = mix(0.85, 1.0, opaqueMode);
        gl_FragColor = vec4(prismaticColor, alphaVal);
      }
    `,
  },
  energy: {
    id: "AX-SHD-004",
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vPosition;
      void main() {
        float glow = 0.3 / (0.15 + length(vPosition));
        gl_FragColor = vec4(color * glow, opacity);
      }
    `,
  },
  neural: {
    id: "AX-SHD-002",
    vertexShader: `
      uniform float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        if (dot(center, center) > 0.25) discard;
        float strength = 1.0 - (length(center) * 2.0);
        gl_FragColor = vec4(vColor, strength * 0.8);
      }
    `,
  },
};

// ----------------------------------------------------
// 3. Intermediate Animation Processing
// ----------------------------------------------------
export class StateController {
  private currentState: AxiomCoreLifecycleState = AXIOM_CORE_LIFECYCLE_STATES[0];

  transitionTo(nextState: AxiomCoreLifecycleState): void {
    this.currentState = nextState;
  }

  getState(): AxiomCoreLifecycleState {
    return this.currentState;
  }

  update(state: AXRuntimeStateData, deltaTime: number): void {
    this.transitionTo(state.lifecycle ?? this.currentState);
    state.lifecycle = this.currentState;
    if (state.signature?.monochrome) {
      state.materials.color = "#ffffff";
    }
  }
}

export class AnimationController {
  private currentScale = 1.0;
  private currentDeformation = 0.0;
  private currentEmission = 0.85;
  private currentLatticeActivity = 0.35;
  private currentLightIntensity = 1.0;

  computeFrameState(state: AXRuntimeStateData, deltaTime: number): AXFrameState {
    const rate = 1.0 - Math.exp(-10 * deltaTime);
    this.currentScale += (state.geometry.scale - this.currentScale) * rate;
    this.currentDeformation += (state.geometry.deformation - this.currentDeformation) * rate;
    this.currentEmission += (state.materials.emission - this.currentEmission) * rate;
    this.currentLatticeActivity += ((state.latticeActivity || 0.35) - this.currentLatticeActivity) * rate;
    this.currentLightIntensity += (state.lighting.intensity - this.currentLightIntensity) * rate;

    // Strict Interaction Constraints (±6° shell tilt, ±4° crystal rotation bias)
    // 6 degrees in radians = 0.1047
    // 4 degrees in radians = 0.0698
    const maxShellTilt = 0.1047;
    const maxCrystalBias = 0.0698;
    
    const interaction = state.signature?.paused ? undefined : state.interaction;
    const pointerX = interaction?.pointerX ?? 0;
    const pointerY = interaction?.pointerY ?? 0;
    
    const shellTiltX = pointerX * maxShellTilt;
    const shellTiltY = pointerY * maxShellTilt;
    const crystalBiasX = pointerX * maxCrystalBias;
    const crystalBiasY = pointerY * maxCrystalBias;

    // Mutate state references to verify mutations in existing baseline tests
    state.geometry.scale = this.currentScale;

    return {
      lifecycle: state.lifecycle ?? AXIOM_CORE_LIFECYCLE_STATES[0],
      scale: this.currentScale,
      deformation: this.currentDeformation,
      color: state.materials.color,
      emission: this.currentEmission,
      particleVelocity: state.particles.velocity,
      particleDensity: state.particles.density,
      lightIntensity: this.currentLightIntensity,
      latticeActivity: this.currentLatticeActivity,
      
      shellTiltX,
      shellTiltY,
      crystalBiasX,
      crystalBiasY,

      monochrome: !!state.signature?.monochrome,
      wireframe: !!state.signature?.wireframe,
      paused: !!state.signature?.paused,
      opaque: !!state.signature?.opaque,
      noLights: !!state.signature?.noLights,
      flatDiffuse: !!state.signature?.flatDiffuse,
      basicShader: !!state.signature?.basicShader,
      noBloom: !!state.signature?.noBloom,

      quality: state.quality || "high",
    };
  }
}

// ----------------------------------------------------
// 4. Render Modules
// ----------------------------------------------------
export class OpticalShell implements AXCoreModule {
  mesh!: THREE.Mesh;
  private context!: AXRenderContext;
  private currentQuality?: "high" | "medium" | "low";
  private baseMaterial!: THREE.ShaderMaterial;
  private flatMaterial!: THREE.MeshStandardMaterial;
  private basicMaterial!: THREE.MeshBasicMaterial;

  initialize(context: AXRenderContext): void {
    this.context = context;
    const geometry = createAxiomCoreShellGeometry("hero");

    this.baseMaterial = new THREE.ShaderMaterial({
      vertexShader: AXShaderRegistry.glass.vertexShader,
      fragmentShader: AXShaderRegistry.glass.fragmentShader,
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        ior: { value: AXCoreConfig.materials.glass.ior },
        roughness: { value: AXCoreConfig.materials.glass.roughness },
        transmission: { value: AXCoreConfig.materials.glass.transmission },
        opaqueMode: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
    });

    this.flatMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 1.0,
      metalness: 0.0,
    });

    this.basicMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.baseMaterial);
    this.context.scene.add(this.mesh);
  }

  private recreateGeometry(quality: "high" | "medium" | "low"): void {
    const geometry = createAxiomCoreShellGeometry(qualityToAxiomCoreTier(quality));
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
  }

  update(state: AXFrameState, deltaTime: number): void {
    if (!this.mesh) return;

    // Dynamic Quality LOD Presets
    if (this.currentQuality !== state.quality) {
      this.currentQuality = state.quality;
      this.recreateGeometry(state.quality);
    }

    // Dynamic Rotation & Pointer Tilts
    if (!state.paused) {
      this.mesh.rotation.y += 0.02 * deltaTime;
    }
    this.mesh.rotation.x = state.shellTiltY;
    this.mesh.rotation.z = -state.shellTiltX;

    // Materials Signature Overrides
    if (state.flatDiffuse) {
      this.mesh.material = this.flatMaterial;
    } else if (state.basicShader) {
      this.mesh.material = this.basicMaterial;
    } else {
      this.mesh.material = this.baseMaterial;
      const mat = this.baseMaterial;
      mat.wireframe = state.wireframe;
      mat.uniforms.opaqueMode.value = state.opaque ? 1.0 : 0.0;
    }

    const targetScale = state.scale;
    this.mesh.scale.setScalar(targetScale);
  }

  dispose(): void {
    if (this.mesh) {
      this.context.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.baseMaterial.dispose();
      this.flatMaterial.dispose();
      this.basicMaterial.dispose();
    }
  }
}

export class CrystalMesh implements AXCoreModule {
  mesh!: THREE.Mesh;
  private context!: AXRenderContext;
  private baseMaterial!: THREE.ShaderMaterial;
  private flatMaterial!: THREE.MeshStandardMaterial;
  private basicMaterial!: THREE.MeshBasicMaterial;

  initialize(context: AXRenderContext): void {
    this.context = context;
    const geometry = createAxiomCoreCrystalGeometry("runtime");
    
    this.baseMaterial = new THREE.ShaderMaterial({
      vertexShader: AXShaderRegistry.crystal.vertexShader,
      fragmentShader: AXShaderRegistry.crystal.fragmentShader,
      uniforms: {
        emissive: { value: new THREE.Color(0x69d4e8) },
        emissiveIntensity: { value: AXCoreConfig.materials.crystal.emissiveIntensity },
        ior: { value: AXCoreConfig.materials.crystal.ior },
        opaqueMode: { value: 0.0 },
      },
      transparent: true,
    });

    this.flatMaterial = new THREE.MeshStandardMaterial({
      color: 0x69d4e8,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.basicMaterial = new THREE.MeshBasicMaterial({
      color: 0x69d4e8,
      wireframe: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.baseMaterial);
    this.context.scene.add(this.mesh);
  }

  update(state: AXFrameState, deltaTime: number): void {
    if (!this.mesh) return;

    if (!state.paused) {
      this.mesh.rotation.y -= 0.015 * deltaTime;
      this.mesh.rotation.x += 0.01 * deltaTime;
    }
    this.mesh.rotation.y += state.crystalBiasX;
    this.mesh.rotation.x += state.crystalBiasY;

    // Materials Overrides
    if (state.flatDiffuse) {
      this.mesh.material = this.flatMaterial;
      this.flatMaterial.color.set(state.color);
    } else if (state.basicShader) {
      this.mesh.material = this.basicMaterial;
      this.basicMaterial.color.set(state.color);
    } else {
      this.mesh.material = this.baseMaterial;
      const mat = this.baseMaterial;
      mat.wireframe = state.wireframe;
      mat.uniforms.opaqueMode.value = state.opaque ? 1.0 : 0.0;
      
      if (state.monochrome) {
        mat.uniforms.emissive.value.setRGB(1.0, 1.0, 1.0);
      } else {
        mat.uniforms.emissive.value.set(state.color);
      }
      mat.uniforms.emissiveIntensity.value = state.emission;
    }

    const scaleFactor = state.scale * (1.0 + state.deformation * 0.05);
    this.mesh.scale.setScalar(scaleFactor);
  }

  dispose(): void {
    if (this.mesh) {
      this.context.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.baseMaterial.dispose();
      this.flatMaterial.dispose();
      this.basicMaterial.dispose();
    }
  }
}

export class NeuralCloud implements AXCoreModule {
  points!: THREE.Points;
  private context!: AXRenderContext;
  private currentQuality?: "high" | "medium" | "low";
  private material!: THREE.ShaderMaterial;

  initialize(context: AXRenderContext): void {
    this.context = context;
    const maxParticles = AXCoreConfig.lod.high.particles;
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);

    for (let index = 0; index < maxParticles; index += 1) {
      const radius = Math.random() * AXCoreConfig.geometry.crystalRadius * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);

      colors[index * 3] = 0.41;
      colors[index * 3 + 1] = 0.83;
      colors[index * 3 + 2] = 0.91;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: AXShaderRegistry.neural.vertexShader,
      fragmentShader: AXShaderRegistry.neural.fragmentShader,
      uniforms: {
        size: { value: AXCoreConfig.particles.baseSize },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.context.scene.add(this.points);
  }

  private recreateParticles(quality: "high" | "medium" | "low"): void {
    const config = AXCoreConfig.lod[quality] || AXCoreConfig.lod.high;
    const maxParticles = config.particles;

    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    for (let index = 0; index < maxParticles; index += 1) {
      const radius = Math.random() * AXCoreConfig.geometry.crystalRadius * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);
      colors[index * 3] = 0.41;
      colors[index * 3 + 1] = 0.83;
      colors[index * 3 + 2] = 0.91;
    }

    this.points.geometry.dispose();
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    newGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.points.geometry = newGeometry;
  }

  update(state: AXFrameState, deltaTime: number): void {
    if (!this.points) return;

    if (this.currentQuality !== state.quality) {
      this.currentQuality = state.quality;
      this.recreateParticles(state.quality);
    }

    if (!state.paused) {
      this.points.rotation.y += state.particleVelocity * 0.05 * deltaTime;
    }
    
    // Hide under opaque signature or Flat Diffuse
    this.points.visible = !state.opaque && !state.flatDiffuse && !state.basicShader;
  }

  dispose(): void {
    if (this.points) {
      this.context.scene.remove(this.points);
      this.points.geometry.dispose();
      this.material.dispose();
    }
  }
}

export class EnergyLattice implements AXCoreModule {
  lines!: THREE.LineSegments;
  private context!: AXRenderContext;
  private material!: THREE.ShaderMaterial;

  initialize(context: AXRenderContext): void {
    this.context = context;
    
    const numPoints = 30;
    const points: THREE.Vector3[] = [];
    const crystalRadius = AXCoreConfig.geometry.crystalRadius;
    
    for (let index = 0; index < numPoints; index += 1) {
      const radius = Math.random() * crystalRadius * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      points.push(new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      ));
    }
    
    const lineVertices: number[] = [];
    for (let i = 0; i < numPoints; i += 1) {
      const p1 = points[i];
      const sorted = points
        .map((p, idx) => ({ p, dist: p1.distanceTo(p), idx }))
        .filter(item => item.idx !== i)
        .sort((a, b) => a.dist - b.dist);
      
      for (let j = 0; j < Math.min(2, sorted.length); j += 1) {
        const p2 = sorted[j].p;
        lineVertices.push(p1.x, p1.y, p1.z);
        lineVertices.push(p2.x, p2.y, p2.z);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineVertices), 3));
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: AXShaderRegistry.energy.vertexShader,
      fragmentShader: AXShaderRegistry.energy.fragmentShader,
      uniforms: {
        color: { value: new THREE.Color(0x69d4e8) },
        opacity: { value: 0.35 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    
    this.lines = new THREE.LineSegments(geometry, this.material);
    this.context.scene.add(this.lines);
  }

  update(state: AXFrameState, deltaTime: number): void {
    if (!this.lines) return;
    if (!state.paused) {
      this.lines.rotation.y -= 0.01 * deltaTime;
    }
    
    this.lines.visible = !state.opaque && !state.flatDiffuse && !state.basicShader;
    
    const mat = this.lines.visible ? this.material : null;
    if (mat) {
      const baseOpacity = state.latticeActivity ? state.latticeActivity * 0.5 : 0.35;
      mat.uniforms.opacity.value = state.monochrome ? baseOpacity * 0.4 : baseOpacity;
      if (state.monochrome) {
        mat.uniforms.color.value.setRGB(1.0, 1.0, 1.0);
      } else {
        mat.uniforms.color.value.set(state.color);
      }
    }
  }

  dispose(): void {
    if (this.lines) {
      this.context.scene.remove(this.lines);
      this.lines.geometry.dispose();
      this.material.dispose();
    }
  }
}

export class QuantumCore implements AXCoreModule {
  mesh!: THREE.Mesh;
  private context!: AXRenderContext;

  initialize(context: AXRenderContext): void {
    this.context = context;
    const geometry = createAxiomCoreQuantumGeometry("runtime");
    const material = createAxiomCoreMaterial("titanium");
    this.mesh = new THREE.Mesh(geometry, material);
    this.context.scene.add(this.mesh);
  }

  update(state: AXFrameState, deltaTime: number): void {
    if (!this.mesh) return;
    const scaleFactor = state.scale * (1.0 + Math.sin(performance.now() * 0.005) * 0.1);
    this.mesh.scale.setScalar(scaleFactor);
  }

  dispose(): void {
    if (this.mesh) {
      this.context.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
  }
}

export class LightingRig implements AXCoreModule {
  keyLight!: THREE.PointLight;
  fillLight!: THREE.AmbientLight;
  accentLight!: THREE.PointLight;
  private context!: AXRenderContext;

  initialize(context: AXRenderContext): void {
    this.context = context;
    this.keyLight = new THREE.PointLight(
      AXCoreConfig.lighting.keyColor,
      AXCoreConfig.lighting.keyIntensity,
      12
    );
    this.keyLight.position.set(2, 3, 5);

    this.fillLight = new THREE.AmbientLight(
      AXCoreConfig.lighting.fillColor,
      AXCoreConfig.lighting.fillIntensity
    );

    this.accentLight = new THREE.PointLight(
      AXCoreConfig.lighting.accentColor,
      AXCoreConfig.lighting.accentIntensity,
      10
    );
    this.accentLight.position.set(-3, -2, -4);

    this.context.scene.add(this.keyLight);
    this.context.scene.add(this.fillLight);
    this.context.scene.add(this.accentLight);
  }

  update(state: AXFrameState, deltaTime: number): void {
    if (!this.keyLight) return;
    
    // Support noLights signature check
    if (state.noLights) {
      this.keyLight.intensity = 0;
      this.fillLight.intensity = 0;
      this.accentLight.intensity = 0;
      return;
    }

    const intensityFactor = state.monochrome ? 0.6 : state.lightIntensity;
    this.keyLight.intensity = AXCoreConfig.lighting.keyIntensity * intensityFactor;
    this.accentLight.intensity = AXCoreConfig.lighting.accentIntensity * intensityFactor;
    this.fillLight.intensity = AXCoreConfig.lighting.fillIntensity;

    if (state.monochrome) {
      this.keyLight.color.setRGB(1.0, 1.0, 1.0);
      this.fillLight.color.setRGB(0.1, 0.1, 0.1);
      this.accentLight.color.setRGB(1.0, 1.0, 1.0);
    } else {
      this.keyLight.color.set(AXCoreConfig.lighting.keyColor);
      this.fillLight.color.set(AXCoreConfig.lighting.fillColor);
      this.accentLight.color.set(AXCoreConfig.lighting.accentColor);
    }
  }

  dispose(): void {
    if (this.keyLight) this.context.scene.remove(this.keyLight);
    if (this.fillLight) this.context.scene.remove(this.fillLight);
    if (this.accentLight) this.context.scene.remove(this.accentLight);
  }
}

// ----------------------------------------------------
// 5. Orchestration Container (AXCoreRoot)
// ----------------------------------------------------
export class AXCoreRoot {
  renderModules: AXCoreModule[] = [];
  modules: any[] = [];
  stateController = new StateController();
  animationController = new AnimationController();
  context!: AXRenderContext;

  constructor(context: AXRenderContext) {
    this.context = context;
    const variant = AXCoreConfig.geometry.activeVariant;

    // Register shaders in canonical platform registry
    Object.values(AXShaderRegistry).forEach((shader) =>
      platformRuntime.registries.shaders.register(shader.id, shader)
    );

    // Register AX-CORE in Asset Registry as a foundation asset
    platformRuntime.registries.assets.register("ax-core-001", this);

    // Register with platform runtime
    platformRuntime.registerStudio(this);

    this.renderModules = [
      new LightingRig(),
      new OpticalShell(),
      new CrystalMesh(),
      new QuantumCore(),
    ];

    if (variant === "B" || variant === "C") {
      this.renderModules.push(new NeuralCloud());
      this.renderModules.push(new EnergyLattice());
    }

    if (variant === "C") {
      AXCoreConfig.lighting.keyIntensity = 3.5;
      AXCoreConfig.lighting.accentIntensity = 2.0;
    }

    this.modules = [
      this.stateController,
      this.animationController,
      ...this.renderModules
    ];
  }

  async initialize(): Promise<void> {
    for (const module of this.renderModules) {
      await module.initialize(this.context);
    }
  }

  update(state: AXRuntimeStateData, deltaTime: number): void {
    // 1. Process target state mutations
    this.stateController.update(state, deltaTime);
    
    // 2. Animate towards target state and output immutable frame state
    const frameState = this.animationController.computeFrameState(state, deltaTime);
    
    // 3. Render modules consume frameState deterministically
    for (const module of this.renderModules) {
      module.update(frameState, deltaTime);
    }
  }

  dispose(): void {
    platformRuntime.unregisterStudio(this);
    for (const module of this.renderModules) {
      module.dispose();
    }
    this.renderModules = [];
    this.modules = [];
  }
}

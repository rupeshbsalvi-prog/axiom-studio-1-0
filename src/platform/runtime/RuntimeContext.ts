import * as THREE from "three";

export interface RuntimeContext {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  [key: string]: any;
}

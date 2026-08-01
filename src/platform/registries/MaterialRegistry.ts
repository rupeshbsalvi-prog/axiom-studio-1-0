import * as THREE from "three";
import { BaseRegistry } from "./Registry";

export class MaterialRegistry extends BaseRegistry<THREE.Material> {
  override validate(entry: THREE.Material): boolean {
    return super.validate(entry) && entry instanceof THREE.Material;
  }
}

export const materialRegistry = new MaterialRegistry();

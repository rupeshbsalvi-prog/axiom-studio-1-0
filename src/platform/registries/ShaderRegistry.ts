import { BaseRegistry } from "./Registry";

export interface ShaderEntry {
  vertexShader: string;
  fragmentShader: string;
}

export class ShaderRegistry extends BaseRegistry<ShaderEntry> {
  override validate(entry: ShaderEntry): boolean {
    return (
      super.validate(entry) &&
      typeof entry.vertexShader === "string" &&
      typeof entry.fragmentShader === "string" &&
      entry.vertexShader.length > 0 &&
      entry.fragmentShader.length > 0
    );
  }
}

export const shaderRegistry = new ShaderRegistry();

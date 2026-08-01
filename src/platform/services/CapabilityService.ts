export interface CapabilityLevel {
  level: "low" | "medium" | "high" | "ultra";
  supported: boolean;
}

export interface PlatformCapabilities {
  rendering: CapabilityLevel;
  memory: CapabilityLevel;
  textures: CapabilityLevel;
  compute: CapabilityLevel;
  precision: CapabilityLevel;
  extensions: Record<string, boolean>;
  maxTextureSize: number;
}

export class CapabilityService {
  private capabilities: PlatformCapabilities | null = null;

  detectCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext | null): PlatformCapabilities {
    if (this.capabilities) return this.capabilities;

    if (!gl) {
      // Mock capabilities for JSDOM or environments without WebGL
      this.capabilities = {
        rendering: { level: "high", supported: true },
        memory: { level: "high", supported: true },
        textures: { level: "high", supported: true },
        compute: { level: "medium", supported: false },
        precision: { level: "high", supported: true },
        extensions: {
          WEBGL_debug_renderer_info: true,
          OES_texture_float: true,
          EXT_texture_filter_anisotropic: true,
        },
        maxTextureSize: 8192,
      };
      return this.capabilities;
    }

    const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
    
    // Shader precision check
    let precisionLevel: "low" | "medium" | "high" = "low";
    const shaderPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (shaderPrecision && shaderPrecision.precision > 0) {
      precisionLevel = "high";
    } else {
      const medPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
      if (medPrecision && medPrecision.precision > 0) {
        precisionLevel = "medium";
      }
    }

    // Max texture size
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;

    // Build capabilities
    this.capabilities = {
      rendering: {
        level: isWebGL2 ? "high" : "medium",
        supported: true,
      },
      memory: {
        level: maxTextureSize >= 8192 ? "high" : maxTextureSize >= 4096 ? "medium" : "low",
        supported: true,
      },
      textures: {
        level: maxTextureSize >= 16384 ? "ultra" : maxTextureSize >= 8192 ? "high" : "medium",
        supported: true,
      },
      compute: {
        level: isWebGL2 ? "medium" : "low",
        supported: isWebGL2,
      },
      precision: {
        level: precisionLevel === "high" ? "high" : "medium",
        supported: true,
      },
      extensions: {
        WEBGL_debug_renderer_info: !!gl.getExtension("WEBGL_debug_renderer_info"),
        OES_texture_float: !!gl.getExtension("OES_texture_float"),
        EXT_texture_filter_anisotropic: !!gl.getExtension("EXT_texture_filter_anisotropic"),
      },
      maxTextureSize,
    };

    return this.capabilities;
  }

  getCapabilities(): PlatformCapabilities {
    if (!this.capabilities) {
      return this.detectCapabilities(null);
    }
    return this.capabilities;
  }
}

export const capabilityService = new CapabilityService();

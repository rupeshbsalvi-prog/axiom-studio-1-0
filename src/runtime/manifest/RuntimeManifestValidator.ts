import { type RuntimeManifest, type RuntimeCapability } from "./RuntimeManifestTypes";

const ALLOWED_RUNTIME_ENTRY_PREFIXES = [
  "/runtime-modules/",
  "/internal-runtimes/",
];

const VALID_CAPABILITIES: RuntimeCapability[] = [
  "readProject",
  "writeProject",
  "useProviders",
  "export",
  "network",
  "filesystem",
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRuntimeManifest(manifest: any): ValidationResult {
  if (!manifest || typeof manifest !== "object") {
    return { valid: false, error: "Manifest must be an object." };
  }

  // 1. Check manifestVersion
  if (manifest.manifestVersion !== "1.0") {
    return { valid: false, error: "Unsupported or missing manifestVersion (must be strictly '1.0')." };
  }

  // 2. Check required fields
  const requiredFields = ["id", "name", "version", "publisher", "runtimeType", "entry", "capabilities", "compatibility"];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      return { valid: false, error: `Missing required field: '${field}'.` };
    }
  }

  // 3. Validate id format
  if (typeof manifest.id !== "string" || manifest.id.trim() === "") {
    return { valid: false, error: "Field 'id' must be a non-empty string." };
  }

  // 4. Validate runtimeType
  const validTypes = ["studio", "provider", "tool", "panel"];
  if (!validTypes.includes(manifest.runtimeType)) {
    return { valid: false, error: `Invalid runtimeType: '${manifest.runtimeType}'.` };
  }

  // 5. Validate entry & moduleUrl safety rules
  const entry = manifest.entry;
  if (!entry || typeof entry !== "object") {
    return { valid: false, error: "Field 'entry' must be an object." };
  }

  const moduleUrl = entry.moduleUrl;
  if (typeof moduleUrl !== "string" || moduleUrl.trim() === "") {
    return { valid: false, error: "Field 'entry.moduleUrl' must be a non-empty string." };
  }

  // Safety checks on moduleUrl
  const hasAllowedPrefix = ALLOWED_RUNTIME_ENTRY_PREFIXES.some((prefix) =>
    moduleUrl.startsWith(prefix)
  );

  if (!hasAllowedPrefix) {
    return {
      valid: false,
      error: `Unsafe or absolute entry.moduleUrl. Must start with one of: ${ALLOWED_RUNTIME_ENTRY_PREFIXES.join(
        ", "
      )}`,
    };
  }

  // Path traversal check
  if (moduleUrl.includes("..") || moduleUrl.includes("\\")) {
    return { valid: false, error: "Unsafe entry.moduleUrl path: path traversal is prohibited." };
  }

  // 6. Validate capabilities
  if (!Array.isArray(manifest.capabilities)) {
    return { valid: false, error: "Field 'capabilities' must be an array." };
  }

  for (const cap of manifest.capabilities) {
    if (!VALID_CAPABILITIES.includes(cap)) {
      return { valid: false, error: `Unsupported capability: '${cap}'.` };
    }
  }

  // 7. Validate compatibility
  const compatibility = manifest.compatibility;
  if (!compatibility || typeof compatibility !== "object") {
    return { valid: false, error: "Field 'compatibility' must be an object." };
  }

  if (typeof compatibility.axiomVersion !== "string" || compatibility.axiomVersion.trim() === "") {
    return { valid: false, error: "Field 'compatibility.axiomVersion' must be a non-empty string." };
  }

  if (typeof compatibility.apiVersion !== "string" || compatibility.apiVersion.trim() === "") {
    return { valid: false, error: "Field 'compatibility.apiVersion' must be a non-empty string." };
  }

  return { valid: true };
}

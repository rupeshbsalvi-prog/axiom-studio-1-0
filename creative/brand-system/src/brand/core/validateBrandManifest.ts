import type { BrandManifest, BrandValidationIssue, BrandValidationResult } from './types';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const ALLOWED_STATUSES = new Set(['draft', 'in-review', 'approved', 'published', 'deprecated']);

export function validateBrandManifest(value: unknown): BrandValidationResult {
  const issues: BrandValidationIssue[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, issues: [{ path: '$', message: 'Manifest must be an object.' }] };
  }
  const data = value as Partial<BrandManifest>;
  const requireString = (key: keyof BrandManifest): void => {
    if (typeof data[key] !== 'string' || String(data[key]).trim() === '') {
      issues.push({ path: String(key), message: 'Expected a non-empty string.' });
    }
  };
  requireString('name'); requireString('version'); requireString('tagline'); requireString('category');
  if (data.id !== 'axiom-studio-brand-system') issues.push({ path: 'id', message: 'Unexpected brand-system id.' });
  if (typeof data.version === 'string' && !VERSION_PATTERN.test(data.version)) issues.push({ path: 'version', message: 'Version must follow semantic versioning.' });
  if (typeof data.status !== 'string' || !ALLOWED_STATUSES.has(data.status)) issues.push({ path: 'status', message: 'Unsupported brand status.' });
  if (!data.authority || typeof data.authority !== 'object') issues.push({ path: 'authority', message: 'Authority configuration is required.' });
  else if (data.authority.runtimeEditingAllowed !== false) issues.push({ path: 'authority.runtimeEditingAllowed', message: 'Runtime editing must remain disabled.' });
  if (!data.security || typeof data.security !== 'object') issues.push({ path: 'security', message: 'Security boundary is required.' });
  else {
    for (const key of ['containsSecrets', 'externalRuntimeCode', 'networkDependencies', 'userSuppliedEndpoints'] as const) {
      if (data.security[key] !== false) issues.push({ path: `security.${key}`, message: 'This static brand package requires false.' });
    }
  }
  if (!data.assets || typeof data.assets !== 'object' || Array.isArray(data.assets)) issues.push({ path: 'assets', message: 'Asset map is required.' });
  return { valid: issues.length === 0, issues };
}

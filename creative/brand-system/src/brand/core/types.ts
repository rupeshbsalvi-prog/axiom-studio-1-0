export type BrandStatus = 'draft' | 'in-review' | 'approved' | 'published' | 'deprecated';

export interface BrandAuthority {
  sourceOfTruth: string;
  approverRole: string;
  changePolicy: string;
  runtimeEditingAllowed: boolean;
}

export interface BrandSecurityBoundary {
  containsSecrets: boolean;
  externalRuntimeCode: boolean;
  networkDependencies: boolean;
  userSuppliedEndpoints: boolean;
  notes?: string;
}

export interface BrandManifest {
  $schema?: string;
  id: 'axiom-studio-brand-system';
  name: string;
  version: string;
  status: BrandStatus;
  tagline: string;
  category: string;
  authority: BrandAuthority;
  security: BrandSecurityBoundary;
  assets: Record<string, string>;
}

export interface BrandValidationIssue { path: string; message: string; }
export interface BrandValidationResult { valid: boolean; issues: BrandValidationIssue[]; }

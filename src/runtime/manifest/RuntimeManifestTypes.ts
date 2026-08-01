export type RuntimeCapability =
  | "readProject"
  | "writeProject"
  | "useProviders"
  | "export"
  | "network"
  | "filesystem";

export type RuntimeType = "studio" | "provider" | "tool" | "panel";

export interface RuntimeManifest {
  manifestVersion: "1.0";
  id: string;
  name: string;
  version: string;
  publisher: string;
  description?: string;

  runtimeType: RuntimeType;

  entry: {
    moduleUrl: string;
    integrity?: string;
    signature?: string;
    signatureMode?: "signed" | "development";
  };

  capabilities: RuntimeCapability[];

  compatibility: {
    axiomVersion: string;
    apiVersion: string;
  };

  metadata?: {
    icon?: string;
    category?: string;
    displayName?: string;
    experimental?: boolean;
  };
}

export type SignatureVerificationStatus =
  | "trusted"
  | "untrusted"
  | "missing"
  | "invalid"
  | "development";

export interface SignatureVerificationContext {
  isDevelopment: boolean;
}

export interface VerificationResult {
  status: SignatureVerificationStatus;
  reason?: string;
}

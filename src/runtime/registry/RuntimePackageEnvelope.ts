import type { RuntimeManifest } from "../manifest/RuntimeManifestTypes";
import type { AxpkgSignatureBlock } from "../../app/projects/axpkg/AxpkgSignatureTypes";

export interface RuntimePackageEnvelope {
  packageType: "axiom.runtime-package";
  packageVersion: "1.0.0";
  exportedAt: string;
  packageId: string;
  runtimeId: string;
  name: string;
  version: string;
  publisher: string;
  description?: string;
  manifest: RuntimeManifest;
  compatibility: {
    axiomVersion: string;
    runtimeApiVersion: string;
  };
  integrity: {
    algorithm: "stable-json-cyrb53";
    packageFingerprint: string;
    manifestFingerprint: string;
  };
  signature?: AxpkgSignatureBlock;
}

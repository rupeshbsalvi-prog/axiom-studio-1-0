import type { AxiomPackageEnvelope } from "./AxpkgTypes";
import { stableJsonStringify } from "./stableJson";

export function createAxpkgSigningPayload(envelope: AxiomPackageEnvelope): string {
  // Exclude the signature block from the payload
  const { signature: _signature, ...unsignedEnvelope } = envelope;
  return stableJsonStringify(unsignedEnvelope);
}

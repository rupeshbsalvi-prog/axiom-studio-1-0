import type { AxiomPackageEnvelope } from "./AxpkgTypes";
import { createAxpkgSigningPayload } from "./AxpkgSigningPayload";
import { decodeBase64Url } from "./base64Url";

export async function verifyAxpkgSignature(params: {
  envelope: AxiomPackageEnvelope;
  publicKeyJwk: JsonWebKey;
}): Promise<{
  valid: boolean;
  reason?: string;
}> {
  if (!params.envelope.signature) {
    return { valid: false, reason: "Signature block is missing." };
  }

  const sigBlock = params.envelope.signature;
  if (sigBlock.algorithm !== "ECDSA-P256-SHA256") {
    return { valid: false, reason: `Unsupported signature algorithm: '${sigBlock.algorithm}'` };
  }

  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      params.publicKeyJwk,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    const payloadStr = createAxpkgSigningPayload(params.envelope);
    const data = new TextEncoder().encode(payloadStr);
    const sigBytes = decodeBase64Url(sigBlock.signatureBase64Url);

    const isValid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      sigBytes as any,
      data
    );

    return {
      valid: isValid,
      reason: isValid ? undefined : "Signature verification failed.",
    };
  } catch (err) {
    return {
      valid: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

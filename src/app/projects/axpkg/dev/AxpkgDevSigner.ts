import type { AxiomPackageEnvelope } from "../AxpkgTypes";
import { createAxpkgSigningPayload } from "../AxpkgSigningPayload";
import { encodeBase64Url } from "../base64Url";

/**
 * DEVELOPMENT AND TEST ONLY utility for local key pair generation and envelope signing.
 * DO NOT import this module inside production files (ImportService, ExportService, WorkspaceShell).
 */
export async function generateDevKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true, // extractable
    ["sign", "verify"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  return {
    privateKey: keyPair.privateKey,
    publicKeyJwk,
  };
}

export async function signAxpkgEnvelope(params: {
  envelope: AxiomPackageEnvelope;
  privateKey: CryptoKey;
  keyId: string;
}): Promise<AxiomPackageEnvelope> {
  const payloadStr = createAxpkgSigningPayload(params.envelope);
  const data = new TextEncoder().encode(payloadStr);

  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    params.privateKey,
    data
  );

  const signatureBase64Url = encodeBase64Url(new Uint8Array(signatureBuffer));

  return {
    ...params.envelope,
    signature: {
      signatureVersion: "1.0.0",
      algorithm: "ECDSA-P256-SHA256",
      keyId: params.keyId,
      signedAt: new Date().toISOString(),
      signatureBase64Url,
    },
  };
}

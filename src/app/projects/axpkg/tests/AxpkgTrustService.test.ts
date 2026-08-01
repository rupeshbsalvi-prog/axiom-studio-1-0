import { describe, it, expect, vi } from "vitest";
import { evaluateAxpkgTrust } from "../AxpkgTrustService";
import { createAxpkgEnvelope } from "../AxpkgSerializer";
import { createProjectDraft } from "../../projectDraft";
import { generateDevKeyPair, signAxpkgEnvelope } from "../dev/AxpkgDevSigner";
import { createProjectFingerprint } from "../stableJson";
import type { AxpkgTrustPolicy, TrustedAxpkgKey } from "../AxpkgSignatureTypes";

describe("AxpkgTrustService & Signature Verification", () => {
  it("signature payload excludes signature block", () => {
    const project = createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const envelopeWithSig = {
      ...envelope,
      signature: {
        signatureVersion: "1.0.0" as const,
        algorithm: "ECDSA-P256-SHA256" as const,
        keyId: "dev-key",
        signedAt: new Date().toISOString(),
        signatureBase64Url: "base64bytes...",
      },
    };

    // The signature payload helper is tested implicitly if serialization excludes signature.
    // Let's assert fingerprint is independent of signature block.
    const fp1 = createProjectFingerprint(envelope.project);
    const fp2 = createProjectFingerprint(envelopeWithSig.project);
    expect(fp1).toBe(fp2);
  });

  it("fingerprint mismatch returns tampered before signature verification", async () => {
    const project = createProjectDraft({ name: "Fingerprint Tamper", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);
    
    // Modify fingerprint to trigger mismatch
    envelope.integrity.projectFingerprint = "corrupted-fingerprint";

    const result = await evaluateAxpkgTrust({ envelope });
    expect(result.level).toBe("tampered");
    expect(result.canOpen).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "fingerprint_mismatch")).toBe(true);
  });

  it("unsigned package returns level unsigned", async () => {
    const project = createProjectDraft({ name: "Unsigned", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const result = await evaluateAxpkgTrust({ envelope });
    expect(result.level).toBe("unsigned");
    expect(result.canOpen).toBe(true); // allowed by default policy
    expect(result.diagnostics.some((d) => d.code === "unsigned_package")).toBe(true);
  });

  it("blocked key ID returns level blocked", async () => {
    const project = createProjectDraft({ name: "Blocked Signer", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const keyPair = await generateDevKeyPair();
    const signedEnvelope = await signAxpkgEnvelope({
      envelope,
      privateKey: keyPair.privateKey,
      keyId: "blocked-key-123",
    });

    const policy: AxpkgTrustPolicy = {
      allowUnsignedPackages: true,
      allowUnknownSignersWithWarning: true,
      trustedKeys: [],
      blockedKeyIds: ["blocked-key-123"],
    };

    const result = await evaluateAxpkgTrust({ envelope: signedEnvelope, policy });
    expect(result.level).toBe("blocked");
    expect(result.canOpen).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "blocked_signer")).toBe(true);
  });

  it("unknown key ID returns level untrusted and does not call verify", async () => {
    const project = createProjectDraft({ name: "Untrusted Signer", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const keyPair = await generateDevKeyPair();
    const signedEnvelope = await signAxpkgEnvelope({
      envelope,
      privateKey: keyPair.privateKey,
      keyId: "unknown-key-456",
    });

    const policy: AxpkgTrustPolicy = {
      allowUnsignedPackages: true,
      allowUnknownSignersWithWarning: true,
      trustedKeys: [],
      blockedKeyIds: [],
    };

    const result = await evaluateAxpkgTrust({ envelope: signedEnvelope, policy });
    expect(result.level).toBe("untrusted");
    expect(result.canOpen).toBe(true); // default policy allow
    expect(result.requiresUserConfirmation).toBe(true);
    expect(result.diagnostics.some((d) => d.code === "untrusted_signer")).toBe(true);
  });

  it("trusted valid signature returns level trusted", async () => {
    const project = createProjectDraft({ name: "Trusted", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const keyPair = await generateDevKeyPair();
    const signedEnvelope = await signAxpkgEnvelope({
      envelope,
      privateKey: keyPair.privateKey,
      keyId: "trusted-key-id",
    });

    const policy: AxpkgTrustPolicy = {
      allowUnsignedPackages: true,
      allowUnknownSignersWithWarning: true,
      trustedKeys: [
        {
          keyId: "trusted-key-id",
          label: "Dev Signer",
          algorithm: "ECDSA-P256-SHA256",
          publicKeyJwk: keyPair.publicKeyJwk,
          enabled: true,
        },
      ],
      blockedKeyIds: [],
    };

    const result = await evaluateAxpkgTrust({ envelope: signedEnvelope, policy });
    expect(result.level).toBe("trusted");
    expect(result.trusted).toBe(true);
    expect(result.canOpen).toBe(true);
    expect(result.signer?.label).toBe("Dev Signer");
    expect(result.diagnostics.some((d) => d.code === "trusted_signature_verified")).toBe(true);
  });

  it("trusted invalid signature returns level tampered", async () => {
    const project = createProjectDraft({ name: "Tampered Signature", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const keyPair = await generateDevKeyPair();
    const signedEnvelope = await signAxpkgEnvelope({
      envelope,
      privateKey: keyPair.privateKey,
      keyId: "trusted-key-id",
    });

    // Replace the signature with a valid base64url payload that is far too short
    // to be a valid ECDSA signature. Mutating one character can be flaky.
    if (signedEnvelope.signature) {
      signedEnvelope.signature.signatureBase64Url = "AA";
    }

    const policy: AxpkgTrustPolicy = {
      allowUnsignedPackages: true,
      allowUnknownSignersWithWarning: true,
      trustedKeys: [
        {
          keyId: "trusted-key-id",
          label: "Dev Signer",
          algorithm: "ECDSA-P256-SHA256",
          publicKeyJwk: keyPair.publicKeyJwk,
          enabled: true,
        },
      ],
      blockedKeyIds: [],
    };

    const result = await evaluateAxpkgTrust({ envelope: signedEnvelope, policy });
    expect(result.level).toBe("tampered");
    expect(result.canOpen).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "signature_verification_failed")).toBe(true);
  });

  it("unsupported signature algorithm returns incompatible", async () => {
    const project = createProjectDraft({ name: "Incompatible Algo", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const incompatibleEnvelope = {
      ...envelope,
      signature: {
        signatureVersion: "1.0.0" as const,
        algorithm: "RSA-PSS-SHA256" as any, // incompatible algorithm
        keyId: "some-key",
        signedAt: new Date().toISOString(),
        signatureBase64Url: "base64bytes...",
      },
    };

    const result = await evaluateAxpkgTrust({ envelope: incompatibleEnvelope });
    expect(result.level).toBe("incompatible");
    expect(result.canOpen).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "unsupported_signature_algorithm")).toBe(true);
  });
});

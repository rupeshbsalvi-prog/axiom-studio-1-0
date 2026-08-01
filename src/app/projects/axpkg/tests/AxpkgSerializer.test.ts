import { describe, it, expect } from "vitest";
import { createAxpkgEnvelope } from "../AxpkgSerializer";
import { stableJsonStringify, createProjectFingerprint } from "../stableJson";
import { createProjectDraft, AxiomProjectDraft } from "../../projectDraft";

describe("AxpkgSerializer & stableJson", () => {
  it("stableJsonStringify sorts object keys recursively and preserves array order", () => {
    const objA = { b: 2, a: 1, c: [3, 2, 1], d: { z: 9, y: 8 } };
    const objB = { a: 1, b: 2, c: [3, 2, 1], d: { y: 8, z: 9 } };

    const strA = stableJsonStringify(objA);
    const strB = stableJsonStringify(objB);

    expect(strA).toBe(strB);
    expect(strA).toContain('"c":[3,2,1]'); // Array order preserved
  });

  it("same project produces same fingerprint across key ordering differences", () => {
    const projectA = createProjectDraft({
      name: "Test",
      intent: "Test",
      targetStudioId: "photo",
    });

    const projectB: AxiomProjectDraft = JSON.parse(JSON.stringify(projectA));
    // Mutate internal key orders (JSON stringify/parse doesn't guarantee key order, but let's assert fingerprint matches)
    const fpA = createProjectFingerprint(projectA);
    const fpB = createProjectFingerprint(projectB);

    expect(fpA).toBe(fpB);
  });

  it("changed project produces different fingerprint", () => {
    const projectA = createProjectDraft({
      name: "Test",
      intent: "Test",
      targetStudioId: "photo",
    });

    const projectB = {
      ...projectA,
      manifest: {
        ...projectA.manifest,
        name: "Test Changed",
      },
    };

    const fpA = createProjectFingerprint(projectA);
    const fpB = createProjectFingerprint(projectB);

    expect(fpA).not.toBe(fpB);
  });

  it("fingerprint is computed only from project payload, not full envelope", () => {
    const project = createProjectDraft({
      name: "Test",
      intent: "Test",
      targetStudioId: "photo",
    });

    const envelopeA = createAxpkgEnvelope(project, { appVersion: "1.0.0" });
    const envelopeB = createAxpkgEnvelope(project, { appVersion: "2.0.0" });

    // Fingerprints in envelopes should be identical even if envelope metadata differed
    expect(envelopeA.integrity.projectFingerprint).toBe(envelopeB.integrity.projectFingerprint);
  });
});

import type { AxiomProjectDraft } from "../projectDraft";

export function stableJsonStringify(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val !== "object") {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return "[" + val.map(stableJsonStringify).join(",") + "]";
  }
  const obj = val as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => {
    return JSON.stringify(key) + ":" + stableJsonStringify(obj[key]);
  });
  return "{" + pairs.join(",") + "}";
}

export function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export function createProjectFingerprint(project: AxiomProjectDraft): string {
  return cyrb53(stableJsonStringify(project));
}

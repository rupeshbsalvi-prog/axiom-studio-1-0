import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production build context", () => {
  it("includes runtime brand assets while keeping the rest of creative excluded", () => {
    const dockerIgnore = readFileSync(".dockerignore", "utf8");

    expect(dockerIgnore).toContain("creative");
    expect(dockerIgnore).toContain("!creative/brand-system/assets/**");
  });
});

/// <reference types="node" />

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const styles = readFileSync(resolve("src/styles.css"), "utf8");

describe("professional Studio panel design language", () => {
  it("fits compact desktop stages and stacks the production zones on mobile", () => {
    expect(styles).toMatch(/@media \(max-width: 1400px\)[\s\S]*?\.studio-production-panel[\s\S]*?min-width:\s*740px/);
    expect(styles).toMatch(/@media \(max-width: 960px\)[\s\S]*?\.studio-production-panel[\s\S]*?grid-template-columns:\s*1fr\s*!important[\s\S]*?min-width:\s*0/);
  });

  it("keeps long specimen words inside the Typography canvas", () => {
    expect(styles).toMatch(/\.typography-specimen h2\s*\{[^}]*overflow-wrap:\s*anywhere/);
  });
});

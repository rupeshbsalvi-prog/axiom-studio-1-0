import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Axiom public typeface program", () => {
  it("defines a license-safe production brief before font files are published", () => {
    const brief = readFileSync("creative/brand-system/docs/axiom-typeface-brief.md", "utf8");

    expect(brief).toMatch(/SIL Open Font License/i);
    expect(brief).toMatch(/Space Grotesk 2\.0/i);
    expect(brief).toMatch(/Gate 1.*approved/i);
    expect(brief).toMatch(/floriankarsten\/space-grotesk/i);
    expect(brief).toMatch(/Axiom Sans/i);
    expect(brief).toMatch(/Latin Extended/i);
    expect(brief).toMatch(/accessibility/i);
    expect(brief).toMatch(/no font binary is approved/i);
  });

  it("publishes an accessible vector-only AXMR glyph-DNA specimen before any font binary", () => {
    const specimen = readFileSync("creative/brand-system/assets/type/axiom-sans-glyph-dna-r1.svg", "utf8");
    const brief = readFileSync("creative/brand-system/docs/axiom-typeface-brief.md", "utf8");

    expect(specimen).toMatch(/<title>Axiom Sans AXMR glyph-DNA specimen<\/title>/i);
    expect(specimen).toMatch(/role="img"/i);
    for (const glyph of ["A", "X", "M", "R"]) {
      expect(specimen).toMatch(new RegExp(`data-glyph="${glyph}"`));
    }
    expect(specimen).not.toMatch(/<font|woff|truetype/i);
    expect(brief).toMatch(/Gate 2.*approved/i);
    expect(brief).toMatch(/axiom-sans-glyph-dna-r1\.svg/i);
  });

  it("publishes lowercase, numeral, and monochrome small-size candidates for Gate 3 review", () => {
    const specimen = readFileSync("creative/brand-system/assets/type/axiom-sans-gate3-specimen-r1.svg", "utf8");
    const brief = readFileSync("creative/brand-system/docs/axiom-typeface-brief.md", "utf8");

    expect(specimen).toMatch(/<title>Axiom Sans Gate 3 specimen<\/title>/i);
    expect(specimen).toMatch(/role="img"/i);
    for (const glyph of ["a", "e", "g", "n", "0", "1", "2", "8"]) {
      expect(specimen).toMatch(new RegExp(`data-glyph="${glyph}"`));
    }
    expect(specimen).toMatch(/data-mode="small-monochrome"/i);
    expect(specimen).toMatch(/16 px/i);
    expect(specimen).not.toMatch(/<font|woff|truetype/i);
    expect(brief).toMatch(/Gate 3.*in progress/i);
    expect(brief).toMatch(/axiom-sans-gate3-specimen-r1\.svg/i);
  });

  it("defines the complete pre-master Latin repertoire and spacing proof", () => {
    const specimen = readFileSync("creative/brand-system/assets/type/axiom-sans-latin-core-proof-r1.svg", "utf8");
    const brief = readFileSync("creative/brand-system/docs/axiom-typeface-brief.md", "utf8");

    expect(specimen).toMatch(/<title>Axiom Sans Latin core proof R1<\/title>/i);
    for (const section of ["latin-core", "diacritics", "punctuation", "spacing", "kerning"]) {
      expect(specimen).toMatch(new RegExp(`data-section="${section}"`));
    }
    expect(specimen).toContain("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(specimen).toContain("abcdefghijklmnopqrstuvwxyz");
    expect(specimen).toMatch(/ÀÁÂÃÄÅĀĂĄÆÇĆ.*ČÐĎ/);
    expect(specimen).toMatch(/àáâãäåāăąæçć.*čðď/);
    expect(specimen).toContain("AVATAR WAVY TYPE AXIOM VECTOR MOTION");
    expect(specimen).toContain("HOH OHO non ono");
    expect(specimen).not.toMatch(/<font|woff|truetype/i);
    expect(brief).toMatch(/Latin core proof R1.*approved/i);
    expect(brief).toMatch(/axiom-sans-latin-core-proof-r1\.svg/i);
    expect(brief).toMatch(/Gate 3.*in progress/i);
  });
});

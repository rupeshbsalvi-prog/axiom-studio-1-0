# Axiom Sans — Public Typeface Program

Status: Gate 1 approved. No font binary is approved, published, or connected to the product runtime.

## Purpose

Axiom Sans will be a public-facing variable typeface for Axiom Studio identity, product interfaces, motion titles, and editorial work. It must feel precise without becoming sterile: open counters, engineered terminals, controlled diagonal cuts, and a distinct angular–fluid rhythm that remains readable at interface sizes.

## License foundation

**Approved base: Space Grotesk 2.0.** The authoritative project distributes its sources under the SIL Open Font License 1.1 and declares no Reserved Font Name in its [OFL file](https://github.com/floriankarsten/space-grotesk/blob/master/OFL.txt). Its [source repository](https://github.com/floriankarsten/space-grotesk) provides broad Latin language coverage, tabular figures, and buildable sources.

The derivative will be renamed **Axiom Sans** to avoid source-family confusion. The original copyright notice, OFL text, source reference, modification record, and new family metadata must ship together. Gate 1 approves Space Grotesk only as the design and engineering foundation; it does not approve an Axiom Sans font binary.

## Character and language scope

- Latin Extended character coverage, punctuation, numerals, currency, mathematical operators, and common creative-software symbols.
- Variable axes: weight 300–800 and optical size for display versus interface use.
- Brand alternates for A, X, M, R, and selected numerals; ordinary text defaults remain conservative.
- Tabular and proportional numerals, case-sensitive punctuation, and accessible distinction between I/l/1 and O/0.

## Accessibility and production checks

- Body text must preserve legibility at 12–16 px and meet WCAG-oriented readability checks in light and dark UI.
- Test Windows, macOS, Android, iOS, Chromium, Firefox, and Safari rendering.
- Validate hinting, kerning, interpolation, diacritics, vertical metrics, font loading, fallback behavior, and cumulative layout shift.
- Publish WOFF2 for web and OTF/TTF desktop builds only after legal review, specimen review, and visual acceptance.

## Approval gates

1. **Approved — Space Grotesk 2.0 selected and recorded as the OFL source family.**
2. Approve the Axiom glyph DNA and first display alphabet specimen.
3. Complete Latin Extended and accessibility testing.
4. Approve trademark/name review and release metadata.
5. Build signed release files and a public specimen page.

Until those gates pass, no font binary is approved for public use and the application must continue using its current safe fallback stack.

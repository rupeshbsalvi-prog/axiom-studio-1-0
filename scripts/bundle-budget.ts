/**
 * Bundle Budget Checker — scripts/bundle-budget.ts
 *
 * Run with: node --experimental-strip-types scripts/bundle-budget.ts
 * (Node.js 22.6+ required — available since the project uses Node LTS)
 *
 * Or install tsx: npm install -D tsx  →  npx tsx scripts/bundle-budget.ts
 *
 * Measures the combined gzipped size of all .js files in each package's dist/
 * fails (exit 1) if any package exceeds its declared budget.
 *
 * Budgets (approved in Sprint 3 — 2026-06-21):
 *   @axiom/tokens        ≤ 3 KB gzip
 *   @axiom/ui-foundation ≤ 6 KB gzip
 *   @axiom/ui-core       ≤ 12 KB gzip
 *
 * Usage:
 *   npm run budget
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import { gzipSync } from "zlib";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// ─── Budget declarations ────────────────────────────────────────────────────

const BUDGETS: Array<{ name: string; distDir: string; limitKb: number }> = [
  {
    name: "@axiom/tokens",
    distDir: "packages/tokens/dist",
    limitKb: 3,
  },
  {
    name: "@axiom/ui-foundation",
    distDir: "packages/ui-foundation/dist",
    limitKb: 6,
  },
  {
    name: "@axiom/ui-core",
    distDir: "packages/ui-core/dist",
    limitKb: 12,
  },
];


function collectJsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...collectJsFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Measurement ────────────────────────────────────────────────────────────

const BYTES_PER_KB = 1024;
let hasFailure = false;
const rows: Array<{ name: string; raw: string; gzip: string; budget: string; status: string }> = [];

for (const { name, distDir, limitKb } of BUDGETS) {
  const dirPath = join(ROOT, distDir);
  let jsFiles: string[];

  try {
    jsFiles = collectJsFiles(dirPath);
  } catch {
    console.error(`\n✗  ${name}: dist not found at ${distDir}\n   Run "npm run build --workspaces" first.\n`);
    hasFailure = true;
    continue;
  }

  if (jsFiles.length === 0) {
    console.error(`\n✗  ${name}: no .js files found in ${distDir}\n`);
    hasFailure = true;
    continue;
  }

  // Concatenate all JS files, then measure combined gzip
  // (approximates a naive bundler that includes everything)
  const combined = Buffer.concat(jsFiles.map((f) => readFileSync(f)));
  const compressed = gzipSync(combined, { level: 9 });
  const rawKb = (combined.length / BYTES_PER_KB).toFixed(2);
  const gzipKb = (compressed.length / BYTES_PER_KB).toFixed(2);
  const limitBytes = limitKb * BYTES_PER_KB;
  const passed = compressed.length <= limitBytes;

  if (!passed) hasFailure = true;

  rows.push({
    name,
    raw: `${rawKb} KB`,
    gzip: `${gzipKb} KB`,
    budget: `≤ ${limitKb} KB`,
    status: passed ? "✓ PASS" : `✗ FAIL  (+${((compressed.length - limitBytes) / BYTES_PER_KB).toFixed(2)} KB over budget)`,
  });
}

// ─── Report ─────────────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(" Axiom Design System — Bundle Budget Report");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log(
  " Package                  Raw        Gzip       Budget     Status"
);
console.log(
  " ─────────────────────────────────────────────────────────────────"
);

for (const row of rows) {
  const name = row.name.padEnd(25);
  const raw  = row.raw.padEnd(10);
  const gzip = row.gzip.padEnd(10);
  const bud  = row.budget.padEnd(10);
  console.log(` ${name} ${raw} ${gzip} ${bud} ${row.status}`);
}

console.log();

if (hasFailure) {
  console.error("✗  One or more packages exceeded their bundle budget. See above.\n");
  process.exit(1);
} else {
  console.log("✓  All packages within budget.\n");
  process.exit(0);
}

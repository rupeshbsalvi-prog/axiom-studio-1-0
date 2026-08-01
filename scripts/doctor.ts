import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Color utilities
const C_RESET = "\x1b[0m";
const C_BOLD = "\x1b[1m";
const C_CYAN = "\x1b[36m";
const C_GREEN = "\x1b[32m";
const C_RED = "\x1b[31m";
const C_YELLOW = "\x1b[33m";
const C_GRAY = "\x1b[90m";

interface DoctorStep {
  name: string;
  weight: number;
  run: () => { passed: boolean; details?: string };
}

console.log(`\n${C_BOLD}${C_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}`);
console.log(` ${C_BOLD}Axiom Design System — Repository Health Doctor CLI${C_RESET}`);
console.log(`${C_BOLD}${C_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}\n`);

const steps: DoctorStep[] = [
  {
    name: "Package Compilations & Builds (tsc -b && vite build)",
    weight: 25,
    run: () => {
      try {
        execSync("npm run build", { stdio: "ignore" });
        return { passed: true };
      } catch (err) {
        return { passed: false, details: "Compilation or build failed. Run 'npm run build' manually to inspect errors." };
      }
    }
  },
  {
    name: "Vitest Test Suite (Unit & Architecture boundary gates)",
    weight: 25,
    run: () => {
      try {
        execSync("npm run test", { stdio: "ignore" });
        return { passed: true };
      } catch (err) {
        return { passed: false, details: "One or more tests failed. Run 'npm test' manually to inspect errors." };
      }
    }
  },
  {
    name: "API Extractor Snapshots (Local validation gates)",
    weight: 15,
    run: () => {
      try {
        execSync("npm run api", { stdio: "ignore" });
        return { passed: true };
      } catch (err) {
        return { passed: false, details: "API signature drift detected. Run 'npm run api' to update snapshots." };
      }
    }
  },
  {
    name: "Bundle Size Budget Verification (Tokens ≤ 3KB, Foundation ≤ 6KB, Core ≤ 12KB)",
    weight: 15,
    run: () => {
      try {
        execSync("npm run budget", { stdio: "ignore" });
        return { passed: true };
      } catch (err) {
        return { passed: false, details: "One or more packages exceeded gzipped bundle budgets. Run 'npm run budget'." };
      }
    }
  },
  {
    name: "Design Token AST Audit Gate (No ad-hoc styles in components)",
    weight: 10,
    run: () => {
      try {
        execSync("npx vitest run packages/ui-core/tests/architecture.test.ts -t \"should enforce Design Token usage audit\"", { stdio: "ignore" });
        return { passed: true };
      } catch (err) {
        return { passed: false, details: "Ad-hoc style variable literals found. Refactor to consume @axiom/tokens." };
      }
    }
  },
  {
    name: "Component & Package Manifest Auto-Generation (generate-manifest.ts)",
    weight: 10,
    run: () => {
      try {
        execSync("node --experimental-strip-types scripts/generate-manifest.ts", { stdio: "ignore" });
        // Verify output exists in engineering/generated
        const genDir = path.resolve(process.cwd(), "engineering", "generated");
        const required = ["component-manifest.json", "package-manifest.json", "dependency-graph.json"];
        const missing = required.filter(f => !fs.existsSync(path.join(genDir, f)));
        if (missing.length > 0) {
          return { passed: false, details: `Manifest outputs missing: ${missing.join(", ")}` };
        }
        return { passed: true };
      } catch (err) {
        return { passed: false, details: "Failed to generate components and dependency graph manifests." };
      }
    }
  }
];

let totalScore = 0;
let failedSteps = 0;

for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  process.stdout.write(` [${C_CYAN}..${C_RESET}] Step ${i + 1}/${steps.length}: ${step.name}... `);
  
  const start = Date.now();
  const res = step.run();
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  
  // Clear the line and print final status
  process.stdout.write("\r");
  if (res.passed) {
    totalScore += step.weight;
    console.log(` [${C_GREEN}✓${C_RESET}] Step ${i + 1}/${steps.length}: ${C_BOLD}${step.name}${C_RESET} ${C_GRAY}(${duration}s)${C_RESET}`);
  } else {
    failedSteps++;
    console.log(` [${C_RED}✗${C_RESET}] Step ${i + 1}/${steps.length}: ${C_BOLD}${C_RED}${step.name}${C_RESET} ${C_GRAY}(${duration}s)${C_RESET}`);
    if (res.details) {
      console.log(`      ${C_YELLOW}└─ Info: ${res.details}${C_RESET}`);
    }
  }
}

// Draw overall health report
console.log(`\n${C_BOLD}${C_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}`);
console.log(` ${C_BOLD}Health Diagnosis Report Summary${C_RESET}`);
console.log(`${C_BOLD}${C_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}\n`);

let scoreColor = C_GREEN;
if (totalScore < 60) scoreColor = C_RED;
else if (totalScore < 90) scoreColor = C_YELLOW;

console.log(`  Health Score: ${scoreColor}${C_BOLD}${totalScore}/100${C_RESET}`);
console.log(`  Status:       ${totalScore === 100 ? `${C_GREEN}Perfect — Design System is fully governed and healthy!${C_RESET}` : `${C_RED}Needs attention — ${failedSteps} gate(s) failed.${C_RESET}`}`);
console.log();

if (failedSteps > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

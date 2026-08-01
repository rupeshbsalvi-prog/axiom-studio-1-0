import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Axiom UI Foundation - Architectural Boundary Checks", () => {
  const packageRoot = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(packageRoot, "package.json");
  const dependencyContractPath = path.join(packageRoot, "dependency-contract.json");

  it("should not have any runtime dependencies in package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const contract = JSON.parse(fs.readFileSync(dependencyContractPath, "utf-8"));
    const deps = Object.keys(pkg.dependencies || {});
    const peerDeps = Object.keys(pkg.peerDependencies || {});

    // Dependencies must be empty (visual-agnostic layer)
    expect(deps.length, `Expected 0 runtime deps, found: ${deps.join(", ")}`).toBe(0);

    // maxDirectDeps contract enforcement
    if (contract.maxDirectDeps !== undefined) {
      expect(
        deps.length,
        `Direct deps (${deps.length}) exceeds contract.maxDirectDeps (${contract.maxDirectDeps})`
      ).toBeLessThanOrEqual(contract.maxDirectDeps);
    }

    // peerDependencies driven by contract
    const contractPeers: string[] = contract.peerDependencies ?? ["react", "react-dom"];
    peerDeps.forEach((dep) => {
      expect(contractPeers, `Unlisted peer dep "${dep}" found`).toContain(dep);
    });
  });

  it("should enforce React Isolation - no imports from react-dom in source", () => {
    const srcDir = path.join(packageRoot, "src");
    
    function checkDir(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if ((file.endsWith(".ts") || file.endsWith(".tsx")) && !fullPath.includes("portal")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const reactDomImportRegex = /from\s+['"]react-dom['"]/g;
          expect(reactDomImportRegex.test(content)).toBe(false);
        }
      });
    }

    checkDir(srcDir);
  });

  it("should enforce Barrel exports - index.ts is the sole public API boundary", () => {
    const srcDir = path.join(packageRoot, "src");
    const indexPath = path.join(srcDir, "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf-8");

    // Gather all source files except index.ts
    const exportsToCheck: string[] = [];
    function gatherFiles(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          gatherFiles(fullPath);
        } else if ((file.endsWith(".ts") || file.endsWith(".tsx")) && fullPath !== indexPath) {
          const relativePath = path.relative(srcDir, fullPath).replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "");
          exportsToCheck.push(relativePath);
        }
      });
    }
    gatherFiles(srcDir);

    // Verify index.ts exports from these files
    exportsToCheck.forEach((relPath) => {
      const exportRegex = new RegExp(`from\\s+['"]\\./${relPath}['"]`);
      expect(indexContent).toSatisfy((content: string) => exportRegex.test(content) || content.includes(`./${relPath}`));
    });
  });

  it("should verify circular dependency safety among internal modules", () => {
    const srcDir = path.join(packageRoot, "src");
    const graph: Record<string, string[]> = {};

    function parseImports(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          parseImports(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const fileRel = path.relative(srcDir, fullPath).replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "");
          
          const imports: string[] = [];
          const importRegex = /from\s+['"](\.\.?[^'"]+)['"]/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const relImport = match[1];
            if (relImport) {
              const absoluteImportPath = path.resolve(dir, relImport);
              const importRel = path.relative(srcDir, absoluteImportPath).replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "");
              imports.push(importRel);
            }
          }
          graph[fileRel] = imports;
        }
      });
    }
    parseImports(srcDir);

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function hasCycle(node: string): boolean {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    }

    Object.keys(graph).forEach((node) => {
      expect(hasCycle(node)).toBe(false);
    });
  });

  it("should enforce deterministic execution checks - no side-effects or forbidden runtime APIs in source code", () => {
    const srcDir = path.join(packageRoot, "src");
    
    // Prohibited runtime side-effect signatures
    const forbiddenAPIs = [
      { name: "fetch", regex: /\bfetch\s*\(/ },
      { name: "XMLHttpRequest", regex: /\bnew\s+XMLHttpRequest\b/ },
      { name: "localStorage", regex: /\blocalStorage\b/ },
      { name: "sessionStorage", regex: /\bsessionStorage\b/ },
      { name: "Math.random", regex: /\bMath\.random\s*\(/ },
      { name: "Date.now", regex: /\bDate\.now\s*\(/ },
    ];

    function checkDir(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          
          forbiddenAPIs.forEach((api) => {
            expect(content).not.toSatisfy((text: string) => api.regex.test(text), `Prohibited API "${api.name}" found in ${file}`);
          });
        }
      });
    }

    checkDir(srcDir);
  });

  it("should enforce forbidden imports at the source level", () => {
    const srcDir = path.join(packageRoot, "src");
    const contract = JSON.parse(fs.readFileSync(dependencyContractPath, "utf-8"));
    const forbiddenModules: string[] = contract.forbidden ?? [];

    if (forbiddenModules.length === 0) return;

    const forbiddenPattern = new RegExp(
      `from\\s+['"](${
        forbiddenModules.map((m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
      })['"]`
    );

    function checkForbiddenDir(dir: string) {
      const entries = fs.readdirSync(dir);
      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          checkForbiddenDir(fullPath);
        } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const match = forbiddenPattern.exec(content);
          expect(
            match,
            `Forbidden import "${match?.[1]}" found in ${path.relative(packageRoot, fullPath)}`
          ).toBeNull();
        }
      });
    }

    checkForbiddenDir(srcDir);
  });
});

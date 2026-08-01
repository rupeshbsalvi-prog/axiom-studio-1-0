import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Axiom Tokens - Architectural Boundary Checks", () => {
  const packageRoot = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(packageRoot, "package.json");
  const dependencyContractPath = path.join(packageRoot, "dependency-contract.json");

  it("should have zero runtime dependencies in package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const contract = JSON.parse(fs.readFileSync(dependencyContractPath, "utf-8"));
    const deps = Object.keys(pkg.dependencies || {});

    expect(deps, `Expected 0 runtime deps, found: ${deps.join(", ")}`).toHaveLength(0);

    if (contract.maxDirectDeps !== undefined) {
      expect(
        deps.length,
        `Direct deps (${deps.length}) exceeds contract.maxDirectDeps (${contract.maxDirectDeps})`
      ).toBeLessThanOrEqual(contract.maxDirectDeps);
    }
  });

  it("should not use any external dependencies in source code imports", () => {
    const srcDir = path.join(packageRoot, "src");
    const files = fs.readdirSync(srcDir);

    files.forEach((file) => {
      if (!file.endsWith(".ts")) return;
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Match import statements: import ... from "..." or import "..."
      const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath === undefined) continue;
        // Allow relative imports
        if (!importPath.startsWith(".")) {
          throw new Error(
            `Architectural violation in ${file}: External import of '${importPath}' is prohibited in @axiom/tokens.`
          );
        }
      }
    });
  });

  it("should verify circular dependency safety among internal modules", () => {
    const srcDir = path.join(packageRoot, "src");
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith(".ts") && f !== "index.ts");
    
    // Parse the local dependency graph of the package
    const graph: Record<string, string[]> = {};
    files.forEach((file) => {
      const name = file.replace(".ts", "");
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      const imports: string[] = [];
      const importRegex = /import\s+[\s\S]*?\s+from\s+['"]\.\/([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const relativeImport = match[1];
        if (relativeImport === undefined) continue;
        imports.push(relativeImport.replace(".js", "").replace(".ts", ""));
      }
      graph[name] = imports;
    });

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

  it("should verify that index.ts exports all other files in src/", () => {
    const srcDir = path.join(packageRoot, "src");
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith(".ts") && f !== "index.ts");
    const indexPath = path.join(srcDir, "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf-8");

    files.forEach((file) => {
      const name = file.replace(".ts", "");
      // Ensure there is an export statement referencing this file name
      const exportRegex = new RegExp(`export\\s+.*\\s+from\\s+['"]\\./${name}['"]`);
      expect(indexContent).toSatisfy((content: string) => exportRegex.test(content) || content.includes(`./${name}`));
    });
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

    const files = fs.readdirSync(srcDir).filter(f => f.endsWith(".ts"));
    files.forEach((file) => {
      const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
      const match = forbiddenPattern.exec(content);
      expect(
        match,
        `Forbidden import "${match?.[1]}" found in ${file}`
      ).toBeNull();
    });
  });
});

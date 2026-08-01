import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Axiom UI Core - Architectural Boundary Checks", () => {
  const packageRoot = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(packageRoot, "package.json");
  const dependencyContractPath = path.join(packageRoot, "dependency-contract.json");

  it("should comply with dependency-contract.json", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const contract = JSON.parse(fs.readFileSync(dependencyContractPath, "utf-8"));
    
    const deps = Object.keys(pkg.dependencies || {});
    const peerDeps = Object.keys(pkg.peerDependencies || {});

    // Every runtime dep must be in contract.imports
    deps.forEach((dep) => {
      expect(contract.imports, `"${dep}" is not in contract.imports`).toContain(dep);
    });

    // Forbidden packages must not appear in package.json dependencies
    contract.forbidden.forEach((forbiddenDep: string) => {
      expect(deps, `Forbidden dep "${forbiddenDep}" found in package.json`).not.toContain(forbiddenDep);
    });

    // peerDependencies must match those declared in the contract
    const contractPeers: string[] = contract.peerDependencies ?? ["react", "react-dom"];
    peerDeps.forEach((dep) => {
      expect(contractPeers, `Unlisted peer dep "${dep}" found`).toContain(dep);
    });

    // maxDirectDeps: total runtime deps must not exceed the limit
    if (contract.maxDirectDeps !== undefined) {
      expect(
        deps.length,
        `Direct deps (${deps.length}) exceeds contract.maxDirectDeps (${contract.maxDirectDeps})`
      ).toBeLessThanOrEqual(contract.maxDirectDeps);
    }
  });

  it("should enforce React Isolation - no imports from react-dom in source", () => {
    const srcDir = path.join(packageRoot, "src");
    
    function checkDir(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
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

    const exportsToCheck: string[] = [];
    function gatherFiles(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          gatherFiles(fullPath);
        } else if ((file.endsWith(".ts") || file.endsWith(".tsx")) && fullPath !== indexPath) {
          const relativePath = path.relative(srcDir, fullPath).replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "");
          // Exclude helper/hook modules that are private, but let's check index.ts contains exports
          exportsToCheck.push(relativePath);
        }
      });
    }
    gatherFiles(srcDir);

    exportsToCheck.forEach((relPath) => {
      // Allow internal components to be re-exported
      if (relPath.startsWith("components/")) {
        const parts = relPath.split("/");
        const componentName = parts[parts.length - 1];

        // Skip index files or internal helper files (like registry.ts, icons, etc.)
        if (componentName === "index" || componentName === "registry" || componentName === "setup" || relPath.includes("/icons/")) {
          return;
        }

        if (componentName) {
          const exportRegex = new RegExp(`export\\s+.*\\s+from\\s+['"]\\./${relPath}['"]`);
          const shortRegex = new RegExp(`from\\s+['"]\\./${relPath}['"]`);
          expect(indexContent).toSatisfy((content: string) => {
            return exportRegex.test(content) || shortRegex.test(content) || content.includes(`./${relPath}`);
          });
        }
      }
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

    // Build a regex that matches any import from a forbidden module
    const forbiddenPattern = new RegExp(
      `from\\s+['"](${
        forbiddenModules.map((m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
      })['"]`
    );

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir);
      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
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

    checkDir(srcDir);
  });

  it("should block relative playground/apps/engineering imports in source files", () => {
    const srcDir = path.join(packageRoot, "src");
    
    function checkDir(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const importRegex = /from\s+['"]([^'"]+)['"]/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            const normalized = importPath.toLowerCase();
            const isForbidden = normalized.includes("playground") || 
                              normalized.includes("apps") || 
                              normalized.includes("engineering");
            expect(
              isForbidden,
              `Forbidden import path "${importPath}" found in ${path.relative(packageRoot, fullPath)}`
            ).toBe(false);
          }
        }
      });
    }

    checkDir(srcDir);
  });

  it("should enforce package layering boundaries (tokens cannot import React, foundation cannot import core)", () => {
    const workspaceRoot = path.resolve(packageRoot, "..", "..");
    
    // 1. Scan tokens
    const tokensSrc = path.join(workspaceRoot, "packages", "tokens", "src");
    if (fs.existsSync(tokensSrc)) {
      const checkTokensDir = (dir: string) => {
        fs.readdirSync(dir).forEach((file) => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            checkTokensDir(fullPath);
          } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
            const content = fs.readFileSync(fullPath, "utf-8");
            expect(content).not.toSatisfy(
              (text: string) => /from\s+['"]react(-dom)?['"]/g.test(text),
              `Tokens package cannot import React or React DOM, but found in ${path.relative(workspaceRoot, fullPath)}`
            );
          }
        });
      };
      checkTokensDir(tokensSrc);
    }

    // 2. Scan foundation
    const foundationSrc = path.join(workspaceRoot, "packages", "ui-foundation", "src");
    if (fs.existsSync(foundationSrc)) {
      const checkFoundationDir = (dir: string) => {
        fs.readdirSync(dir).forEach((file) => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            checkFoundationDir(fullPath);
          } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
            const content = fs.readFileSync(fullPath, "utf-8");
            const importRegex = /from\s+['"]([^'"]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
              const importPath = match[1];
              const normalized = importPath.toLowerCase();
              const isForbidden = normalized.includes("ui-core") || 
                                normalized.includes("apps") || 
                                normalized.includes("playground") || 
                                normalized.includes("engineering");
              expect(
                isForbidden,
                `Foundation cannot import from core/apps/playground/engineering. Found: "${importPath}" in ${path.relative(workspaceRoot, fullPath)}`
              ).toBe(false);
            }
          }
        });
      };
      checkFoundationDir(foundationSrc);
    }
  });

  it("should enforce Design Token usage audit with rule-based AST traversal", () => {
    const srcDir = path.join(packageRoot, "src");

    const auditedProperties = new Set([
      "color", "backgroundcolor", "bordercolor", "borderradius",
      "padding", "paddingtop", "paddingbottom", "paddingleft", "paddingright",
      "margin", "margintop", "marginbottom", "marginleft", "marginright",
      "gap"
    ]);

    const tokenIdentifiers = new Set(["colors", "radius", "spacing", "typography", "elevation", "theme"]);

    function referencesTokens(n: ts.Node): boolean {
      let found = false;
      function visitNode(node: ts.Node) {
        if (ts.isIdentifier(node) && tokenIdentifiers.has(node.text.toLowerCase())) {
          found = true;
        }
        if (!found) {
          ts.forEachChild(node, visitNode);
        }
      }
      visitNode(n);
      return found;
    }

    function isExpressionAllowed(expr: ts.Expression): boolean {
      if (ts.isParenthesizedExpression(expr)) {
        return isExpressionAllowed(expr.expression);
      }
      if (ts.isAsExpression(expr)) {
        return isExpressionAllowed(expr.expression);
      }
      if (ts.isTypeAssertionExpression(expr)) {
        return isExpressionAllowed(expr.expression);
      }

      // String literals: must be legitimate defaults
      if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
        const val = expr.text.trim();
        const defaults = new Set([
          "0", "0px", "0rem", "0em", "auto", "none", "transparent",
          "inherit", "initial", "unset", "currentcolor", "100%", "100vh", "100vw", "50%"
        ]);
        return val === "" || defaults.has(val.toLowerCase());
      }

      // Numeric literals: must be 0
      if (ts.isNumericLiteral(expr)) {
        return expr.text === "0";
      }

      // Boolean/Null/Undefined are allowed
      if (expr.kind === ts.SyntaxKind.TrueKeyword || 
          expr.kind === ts.SyntaxKind.FalseKeyword ||
          expr.kind === ts.SyntaxKind.NullKeyword) {
        return true;
      }
      if (ts.isIdentifier(expr) && expr.text === "undefined") {
        return true;
      }

      if (referencesTokens(expr)) {
        return true;
      }

      if (ts.isConditionalExpression(expr)) {
        return isExpressionAllowed(expr.whenTrue) && isExpressionAllowed(expr.whenFalse);
      }

      if (ts.isBinaryExpression(expr)) {
        return isExpressionAllowed(expr.left) && isExpressionAllowed(expr.right);
      }

      if (ts.isPrefixUnaryExpression(expr) || ts.isPostfixUnaryExpression(expr)) {
        return isExpressionAllowed(expr.operand);
      }

      if (ts.isTemplateExpression(expr)) {
        return expr.templateSpans.every(span => isExpressionAllowed(span.expression));
      }

      return true;
    }

    function checkFile(filePath: string) {
      const sourceText = fs.readFileSync(filePath, "utf-8");
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true
      );

      function visit(node: ts.Node) {
        // Case 1: PropertyAssignment in object literal style
        if (ts.isPropertyAssignment(node)) {
          const nameText = node.name.getText(sourceFile).replace(/['"]/g, "").toLowerCase();
          if (auditedProperties.has(nameText)) {
            const allowed = isExpressionAllowed(node.initializer);
            expect(
              allowed,
              `Ad-hoc styling variable "${nameText}: ${node.initializer.getText(sourceFile)}" found in ${path.relative(packageRoot, filePath)}`
            ).toBe(true);
          }
        }

        // Case 2: BinaryExpression assignments like obj.color = ...
        if (
          ts.isBinaryExpression(node) &&
          node.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ) {
          const leftText = node.left.getText(sourceFile).toLowerCase();
          const parts = leftText.split(".");
          const lastProp = parts[parts.length - 1];
          if (auditedProperties.has(lastProp)) {
            const allowed = isExpressionAllowed(node.right);
            expect(
              allowed,
              `Ad-hoc styling variable assignment "${leftText} = ${node.right.getText(sourceFile)}" found in ${path.relative(packageRoot, filePath)}`
            ).toBe(true);
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    function scanDir(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith(".tsx")) {
          checkFile(fullPath);
        }
      });
    }

    scanDir(srcDir);
  });
});

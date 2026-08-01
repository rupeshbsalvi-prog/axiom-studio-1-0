import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as ts from "typescript";

// Target output directory
const OUTPUT_DIR = path.resolve(process.cwd(), "engineering", "generated");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to run shell command and return stdout cleanly
function runCmd(cmd: string): string {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch {
    return "unknown";
  }
}

// Get git details
const gitCommit = runCmd("git rev-parse HEAD");

// Find all TS/TSX files recursively
function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(filePath);
    }
  });
  return results;
}

// Parse value from AST node
function parseASTValue(node: ts.Expression): any {
  if (ts.isAsExpression(node)) {
    return parseASTValue(node.expression);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((el) => parseASTValue(el));
  }
  if (ts.isObjectLiteralExpression(node)) {
    const obj: any = {};
    node.properties.forEach((prop) => {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        obj[prop.name.text] = parseASTValue(prop.initializer);
      }
    });
    return obj;
  }
  return null;
}

// Extract component metadata from source files
function extractMetadataFromFiles(files: string[]): Record<string, any> {
  const components: Record<string, any> = {};

  files.forEach((file) => {
    const sourceText = fs.readFileSync(file, "utf-8");
    const sourceFile = ts.createSourceFile(
      file,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node: ts.Node) {
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        // Look for ComponentName.metadata = ... or (ComponentName as any).metadata = ...
        let leftHandSide = node.left;
        if (ts.isAsExpression(leftHandSide)) {
          leftHandSide = leftHandSide.expression;
        }

        if (ts.isPropertyAccessExpression(leftHandSide)) {
          let objectNode = leftHandSide.expression;
          if (ts.isParenthesizedExpression(objectNode)) {
            let inner = objectNode.expression;
            if (ts.isAsExpression(inner)) {
              inner = inner.expression;
            }
            objectNode = inner;
          }

          const propName = leftHandSide.name.text;

          if (propName === "metadata" && ts.isIdentifier(objectNode)) {
            const componentName = objectNode.text;
            const metaObj = parseASTValue(node.right);
            if (metaObj && typeof metaObj === "object") {
              components[componentName] = {
                name: componentName,
                ...metaObj,
              };
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  });

  return components;
}

// 1. Gather all component files
const uiCoreFiles = getFilesRecursively(path.resolve(process.cwd(), "packages", "ui-core", "src"));
const uiFoundationFiles = getFilesRecursively(path.resolve(process.cwd(), "packages", "ui-foundation", "src"));
const allSourceFiles = [...uiCoreFiles, ...uiFoundationFiles];

// 2. Extract metadata
const componentsMap = extractMetadataFromFiles(allSourceFiles);

// 3. Generate component-manifest.json
const componentManifest = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  gitCommit: gitCommit,
  release: "EB-1.0",
  components: componentsMap,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "component-manifest.json"),
  JSON.stringify(componentManifest, null, 2),
  "utf-8"
);
console.log("✓ Component manifest written successfully.");

// 4. Generate package-manifest.json
const packagesMap: Record<string, any> = {};
const packagesDir = path.resolve(process.cwd(), "packages");
if (fs.existsSync(packagesDir)) {
  const pkgs = fs.readdirSync(packagesDir);
  pkgs.forEach((p) => {
    const pkgPath = path.join(packagesDir, p, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      packagesMap[pkg.name] = {
        version: pkg.version,
        dependencies: pkg.dependencies || {},
        peerDependencies: pkg.peerDependencies || {},
        devDependencies: pkg.devDependencies || {},
      };
    }
  });
}

const packageManifest = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  gitCommit: gitCommit,
  packages: packagesMap,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "package-manifest.json"),
  JSON.stringify(packageManifest, null, 2),
  "utf-8"
);
console.log("✓ Package manifest written successfully.");

// 5. Generate dependency-graph.json
const nodes: Array<{ id: string; type: "component" | "package"; package?: string }> = [];
const edges: Array<{ source: string; target: string }> = [];

// Add package nodes & package-to-package edges
Object.keys(packagesMap).forEach((pkgName) => {
  nodes.push({ id: pkgName, type: "package" });
  const deps = { ...packagesMap[pkgName].dependencies, ...packagesMap[pkgName].peerDependencies };
  Object.keys(deps).forEach((depName) => {
    if (depName.startsWith("@axiom/")) {
      edges.push({ source: pkgName, target: depName });
    }
  });
});

// Add component nodes & component-to-component/package edges
Object.keys(componentsMap).forEach((compName) => {
  const comp = componentsMap[compName];
  nodes.push({ id: compName, type: "component", package: comp.package });
  
  if (Array.isArray(comp.dependencies)) {
    comp.dependencies.forEach((dep: string) => {
      edges.push({ source: compName, target: dep });
    });
  }
});

const dependencyGraph = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  gitCommit: gitCommit,
  nodes,
  edges,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "dependency-graph.json"),
  JSON.stringify(dependencyGraph, null, 2),
  "utf-8"
);
console.log("✓ Dependency graph written successfully.");

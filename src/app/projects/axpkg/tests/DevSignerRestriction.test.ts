import { describe, it, expect } from "vitest";

// Use require to avoid strict ESM typecheck errors without @types/node globally
declare const require: any;
const fs = typeof require !== "undefined" ? require("fs") : null;

describe("DevSigner restriction check", () => {
  it("verifies production code files do not import AxpkgDevSigner", () => {
    if (!fs) {
      return;
    }
    const importServicePath = "./src/app/projects/axpkg/AxpkgImportService.ts";
    const exportServicePath = "./src/app/projects/axpkg/AxpkgExportService.ts";
    const workspaceShellPath = "./src/workspace/WorkspaceShell.tsx";

    const importContent = fs.readFileSync(importServicePath, "utf-8");
    const exportContent = fs.readFileSync(exportServicePath, "utf-8");
    const shellContent = fs.readFileSync(workspaceShellPath, "utf-8");

    // Assert lack of import keywords referencing the DevSigner utility
    expect(importContent).not.toContain("AxpkgDevSigner");
    expect(exportContent).not.toContain("AxpkgDevSigner");
    expect(shellContent).not.toContain("AxpkgDevSigner");
  });
});

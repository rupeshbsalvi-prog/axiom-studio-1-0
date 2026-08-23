import { describe, expect, it, vi } from "vitest";

const workspaceProbe = vi.hoisted(() => ({ loaded: vi.fn() }));

vi.mock("../workspace/WorkspaceShell", async () => {
  workspaceProbe.loaded();
  return vi.importActual("../workspace/WorkspaceShell");
});

describe("authentication bundle boundary", () => {
  it("does not load the Workspace shell before explicit entry", async () => {
    await import("./AuthWorkspaceGate");

    expect(workspaceProbe.loaded).not.toHaveBeenCalled();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthWorkspaceGate } from "./AuthWorkspaceGate";

vi.mock("../workspace/WorkspaceShell", () => ({
  WorkspaceShell: ({
    workspaceEntry,
    workspaceLearningPolicy,
    onChangeWorkspace,
    onLogout,
    logoutError,
  }: any) => (
    <section aria-label="Workspace shell">
      <span>{workspaceEntry.mode === "local" ? "Local workspace" : workspaceEntry.workspaceId}</span>
      <span>{workspaceLearningPolicy.status}</span>
      <button type="button" onClick={onChangeWorkspace}>Change workspace</button>
      {onLogout && <button type="button" onClick={onLogout}>Sign out</button>}
      {logoutError && <p role="alert">{logoutError}</p>}
    </section>
  ),
}));

const session = (workspaceIds = ["workspace-one"]) => ({
  contractVersion: "axiom-auth-session.v1",
  status: "authenticated",
  user: { id: "user-1", email: "person@example.com" },
  memberships: workspaceIds.map((workspaceId, index) => ({
    workspaceId,
    memberId: "user-1",
    role: index === 0 ? "member" : "viewer",
    status: "active",
  })),
});

const policy = (workspaceId: string) => ({
  contractVersion: "axiom-workspace-learning-authority.v1",
  membership: {
    workspaceId,
    memberId: "user-1",
    role: "member",
    status: "active",
  },
  policy: {
    policyId: `${workspaceId}:learning`,
    policyVersion: 1,
    workspaceId,
    learningAllowed: true,
    allowedScopes: ["local_workspace"],
    policyRequired: true,
    source: "server_configuration",
  },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderGate() {
  return render(
    <AuthWorkspaceGate
      renderLanding={(enterWorkspace) => (
        <button type="button" onClick={enterWorkspace}>Enter Workspace</button>
      )}
    />,
  );
}

describe("AuthWorkspaceGate", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it("preserves public entry and offers explicit fail-closed local entry when unauthenticated", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: "unauthorized" }, 401));
    renderGate();

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/session", {
      credentials: "include",
      headers: { Accept: "application/json" },
    }));
    expect(screen.getByRole("button", { name: "Enter Workspace" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enter Workspace" }));
    expect(screen.getByRole("link", { name: "Sign in with Google" })).toHaveAttribute(
      "href",
      "/api/auth/login",
    );
    await user.click(screen.getByRole("button", { name: "Continue locally" }));

    const workspace = await screen.findByRole("region", { name: "Workspace shell" });
    expect(workspace).toHaveTextContent("Local workspace");
    expect(workspace).toHaveTextContent("required_unavailable");
  });

  it("never selects even the only membership without explicit confirmation", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(session()));
    renderGate();

    const option = await screen.findByRole("radio", { name: /workspace-one.*member/i });
    expect(option).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Enter selected workspace" })).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("loads policy only for the explicitly selected workspace and supports explicit switching", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(session(["workspace-one", "workspace-two"])))
      .mockResolvedValueOnce(jsonResponse(policy("workspace-two")));
    renderGate();

    await user.click(await screen.findByRole("radio", { name: /workspace-two.*viewer/i }));
    await user.click(screen.getByRole("button", { name: "Enter selected workspace" }));

    expect(await screen.findByRole("region", { name: "Workspace shell" })).toHaveTextContent("workspace-two");
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/workspaces/workspace-two/learning-policy",
      { credentials: "include", headers: { Accept: "application/json" } },
    );

    await user.click(screen.getByRole("button", { name: "Change workspace" }));
    expect(screen.getByRole("radio", { name: /workspace-two.*viewer/i })).not.toBeChecked();
  });

  it("rejects a workspace that the authenticated session cannot authorize", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(session()))
      .mockResolvedValueOnce(jsonResponse({ detail: "not found" }, 404));
    renderGate();

    await user.click(await screen.findByRole("radio", { name: /workspace-one.*member/i }));
    await user.click(screen.getByRole("button", { name: "Enter selected workspace" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Workspace access is unavailable");
    expect(screen.queryByRole("region", { name: "Workspace shell" })).not.toBeInTheDocument();
  });

  it("enters with learning authority failed closed when required policy is unavailable", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(session()))
      .mockResolvedValueOnce(jsonResponse({ detail: "unavailable" }, 503));
    renderGate();

    await user.click(await screen.findByRole("radio", { name: /workspace-one.*member/i }));
    await user.click(screen.getByRole("button", { name: "Enter selected workspace" }));

    expect(await screen.findByRole("region", { name: "Workspace shell" })).toHaveTextContent("workspace-one");
    expect(screen.getByRole("region", { name: "Workspace shell" })).toHaveTextContent("required_unavailable");
  });

  it("does not remember an unconfirmed workspace after returning to the landing page", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(session()));
    renderGate();

    await user.click(await screen.findByRole("radio", { name: /workspace-one.*member/i }));
    await user.click(screen.getByRole("button", { name: "Back to landing" }));
    await user.click(screen.getByRole("button", { name: "Enter Workspace" }));

    expect(screen.getByRole("radio", { name: /workspace-one.*member/i })).not.toBeChecked();
  });

  it("logs out only after server revocation succeeds", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(session()))
      .mockResolvedValueOnce(jsonResponse(policy("workspace-one")))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    renderGate();

    await user.click(await screen.findByRole("radio", { name: /workspace-one.*member/i }));
    await user.click(screen.getByRole("button", { name: "Enter selected workspace" }));
    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(fetch).toHaveBeenLastCalledWith("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    expect(await screen.findByRole("link", { name: "Sign in with Google" })).toBeInTheDocument();
  });

  it("keeps the governed workspace visible when logout cannot be confirmed", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(session()))
      .mockResolvedValueOnce(jsonResponse(policy("workspace-one")))
      .mockResolvedValueOnce(jsonResponse({ detail: "failed" }, 500));
    renderGate();

    await user.click(await screen.findByRole("radio", { name: /workspace-one.*member/i }));
    await user.click(screen.getByRole("button", { name: "Enter selected workspace" }));
    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign out could not be confirmed");
    expect(screen.getByRole("region", { name: "Workspace shell" })).toHaveTextContent("workspace-one");
  });
});

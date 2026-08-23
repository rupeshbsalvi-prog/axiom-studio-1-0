import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import type {
  ImagineXWorkspaceLearningPolicyState,
  WorkspaceLearningAuthorityV1,
} from "../app/services/ImagineXLearningAuthority";
import type { WorkspaceEntryContext } from "../workspace/WorkspaceShell";

const WorkspaceShell = lazy(() => import("../workspace/WorkspaceShell").then((module) => ({
  default: module.WorkspaceShell,
})));

type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

interface AuthMembership {
  workspaceId: string;
  memberId: string;
  role: WorkspaceRole;
  status: "active";
}

interface AuthSession {
  contractVersion: "axiom-auth-session.v1";
  status: "authenticated";
  user: { id: string; email: string | null };
  memberships: AuthMembership[];
}

type SessionStatus = "checking" | "unauthenticated" | "authenticated" | "error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRole(value: unknown): value is WorkspaceRole {
  return value === "owner" || value === "admin" || value === "member" || value === "viewer";
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value) || value.contractVersion !== "axiom-auth-session.v1" || value.status !== "authenticated") {
    return false;
  }
  if (!isRecord(value.user) || typeof value.user.id !== "string") return false;
  if (value.user.email !== null && typeof value.user.email !== "string") return false;
  return Array.isArray(value.memberships) && value.memberships.length > 0 && value.memberships.every(
    (membership) => isRecord(membership)
      && typeof membership.workspaceId === "string"
      && membership.workspaceId.length > 0
      && typeof membership.memberId === "string"
      && isRole(membership.role)
      && membership.status === "active",
  );
}

function isWorkspaceAuthority(value: unknown, workspaceId: string): value is WorkspaceLearningAuthorityV1 {
  if (!isRecord(value) || value.contractVersion !== "axiom-workspace-learning-authority.v1") return false;
  if (!isRecord(value.membership) || !isRecord(value.policy)) return false;
  return value.membership.workspaceId === workspaceId
    && typeof value.membership.memberId === "string"
    && isRole(value.membership.role)
    && value.membership.status === "active"
    && typeof value.policy.policyId === "string"
    && value.policy.workspaceId === workspaceId
    && value.policy.policyVersion === 1
    && typeof value.policy.learningAllowed === "boolean"
    && Array.isArray(value.policy.allowedScopes)
    && value.policy.allowedScopes.every((scope) => scope === "local_workspace")
    && typeof value.policy.policyRequired === "boolean"
    && value.policy.source === "server_configuration";
}

const requestOptions = {
  credentials: "include" as const,
  headers: { Accept: "application/json" },
};

export function AuthWorkspaceGate({
  renderLanding,
}: {
  renderLanding: (enterWorkspace: () => void) => ReactNode;
}) {
  const [workspaceRequested, setWorkspaceRequested] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceEntry, setWorkspaceEntry] = useState<WorkspaceEntryContext | null>(null);
  const [workspacePolicy, setWorkspacePolicy] = useState<ImagineXWorkspaceLearningPolicyState>({
    status: "required_unavailable",
  });
  const [entryError, setEntryError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [policyLoading, setPolicyLoading] = useState(false);

  const readSession = useCallback(async () => {
    setSessionStatus("checking");
    setEntryError("");
    try {
      const response = await fetch("/api/auth/session", requestOptions);
      if (response.status === 401) {
        setSession(null);
        setSessionStatus("unauthenticated");
        return;
      }
      if (!response.ok) throw new Error("session unavailable");
      const payload: unknown = await response.json();
      if (!isAuthSession(payload)) throw new Error("invalid session contract");
      setSession(payload);
      setSessionStatus("authenticated");
      setWorkspaceRequested(true);
    } catch {
      setSession(null);
      setSessionStatus("error");
      setEntryError("Session status is unavailable. Retry or continue locally.");
    }
  }, []);

  useEffect(() => {
    void readSession();
  }, [readSession]);

  const continueLocally = () => {
    setEntryError("");
    setWorkspaceEntry({ mode: "local" });
    setWorkspacePolicy({ status: "required_unavailable" });
  };

  const enterSelectedWorkspace = async () => {
    const membership = session?.memberships.find(
      (candidate) => candidate.workspaceId === selectedWorkspaceId,
    );
    if (!membership) return;

    setEntryError("");
    setPolicyLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${encodeURIComponent(membership.workspaceId)}/learning-policy`,
        requestOptions,
      );
      if (response.status === 401) {
        setSession(null);
        setSelectedWorkspaceId("");
        setSessionStatus("unauthenticated");
        return;
      }
      if (response.status === 404) {
        setEntryError("Workspace access is unavailable. Choose another active membership.");
        return;
      }
      if (response.status === 503) {
        setWorkspacePolicy({ status: "required_unavailable" });
      } else {
        if (!response.ok) throw new Error("policy unavailable");
        const payload: unknown = await response.json();
        if (!isWorkspaceAuthority(payload, membership.workspaceId)) {
          throw new Error("invalid policy contract");
        }
        setWorkspacePolicy({ status: "verified", authority: payload });
      }
      setWorkspaceEntry({
        mode: "authenticated",
        workspaceId: membership.workspaceId,
        role: membership.role,
        email: session?.user.email ?? null,
      });
    } catch {
      setEntryError("Workspace policy could not be verified. Retry or continue locally.");
    } finally {
      setPolicyLoading(false);
    }
  };

  const changeWorkspace = () => {
    setWorkspaceEntry(null);
    setSelectedWorkspaceId("");
    setWorkspacePolicy({ status: "required_unavailable" });
    setEntryError("");
    setLogoutError("");
  };

  const backToLanding = () => {
    setSelectedWorkspaceId("");
    setEntryError("");
    setWorkspaceRequested(false);
  };

  const logout = async () => {
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
        ...requestOptions,
      });
      if (response.status !== 204) throw new Error("logout failed");
      setWorkspaceEntry(null);
      setSelectedWorkspaceId("");
      setWorkspacePolicy({ status: "required_unavailable" });
      setSession(null);
      setSessionStatus("unauthenticated");
    } catch {
      setLogoutError("Sign out could not be confirmed. Retry when the server is available.");
    }
  };

  if (!workspaceRequested) {
    return <>{renderLanding(() => setWorkspaceRequested(true))}</>;
  }

  if (workspaceEntry) {
    return (
      <Suspense fallback={<main className="auth-entry-page"><p role="status">Opening workspace…</p></main>}>
        <WorkspaceShell
          workspaceEntry={workspaceEntry}
          workspaceLearningPolicy={workspacePolicy}
          onChangeWorkspace={changeWorkspace}
          onLogout={workspaceEntry.mode === "authenticated" ? logout : undefined}
          logoutError={logoutError || undefined}
        />
      </Suspense>
    );
  }

  if (sessionStatus === "checking") {
    return <main className="auth-entry-page"><p role="status">Checking your session…</p></main>;
  }

  if (sessionStatus !== "authenticated" || !session) {
    return (
      <main className="auth-entry-page">
        <section className="auth-entry-card" aria-labelledby="auth-entry-title">
          <p className="eyebrow">Workspace entry</p>
          <h1 id="auth-entry-title">Choose how to enter Axiom Studio</h1>
          <p>Sign in for a governed workspace, or continue with local project authority only.</p>
          {entryError && <p className="auth-error" role="alert">{entryError}</p>}
          <div className="auth-entry-actions">
            <a className="primary-button" href="/api/auth/login">Sign in with Google</a>
            <button type="button" className="ghost-button" onClick={continueLocally}>Continue locally</button>
            {sessionStatus === "error" && (
              <button type="button" className="ghost-button" onClick={() => void readSession()}>Retry session</button>
            )}
            <button type="button" className="ghost-button" onClick={backToLanding}>Back to landing</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-entry-page">
      <section className="auth-entry-card" aria-labelledby="workspace-selection-title">
        <p className="eyebrow">Authenticated workspace entry</p>
        <h1 id="workspace-selection-title">Choose a workspace</h1>
        <p>{session.user.email ?? "Authenticated user"}</p>
        <fieldset className="workspace-membership-list">
          <legend>Active memberships</legend>
          {session.memberships.map((membership) => (
            <label key={membership.workspaceId}>
              <input
                type="radio"
                name="workspace-membership"
                value={membership.workspaceId}
                checked={selectedWorkspaceId === membership.workspaceId}
                onChange={() => {
                  setSelectedWorkspaceId(membership.workspaceId);
                  setEntryError("");
                }}
              />
              <span>{membership.workspaceId}</span>
              <small>{membership.role}</small>
            </label>
          ))}
        </fieldset>
        {entryError && <p className="auth-error" role="alert">{entryError}</p>}
        <div className="auth-entry-actions">
          <button
            type="button"
            className="primary-button"
            disabled={!selectedWorkspaceId || policyLoading}
            onClick={() => void enterSelectedWorkspace()}
          >
            {policyLoading ? "Verifying workspace…" : "Enter selected workspace"}
          </button>
          <button type="button" className="ghost-button" onClick={continueLocally}>Continue locally</button>
          <button type="button" className="ghost-button" onClick={backToLanding}>Back to landing</button>
        </div>
      </section>
    </main>
  );
}

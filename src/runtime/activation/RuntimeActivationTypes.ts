import { type RuntimeCapability } from "../manifest/RuntimeManifestTypes";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface RuntimeActionDefinition {
  id: string;
  label: string;
  description?: string;
  requiredCapabilities: RuntimeCapability[];
}

export interface RuntimeActivationContext {
  runtimeId: string;
  grantedCapabilities: RuntimeCapability[];
  workspaceId?: string;
  draftId?: string;
}

export interface ActivatedRuntime {
  runtimeId: string;
  manifestId: string;
  actions: RuntimeActionDefinition[];
  status: "active" | "inactive" | "failed";
  activatedAt: string;
  grantedCapabilities: RuntimeCapability[];
}

export type RuntimeActivationFailureReason =
  | "runtime_not_found"
  | "runtime_disabled"
  | "no_actions_defined"
  | "activation_error";

export type RuntimeExecutionFailureReason =
  | "runtime_not_found"
  | "runtime_disabled"
  | "runtime_not_active"
  | "action_not_found"
  | "executor_missing"
  | "authority_blocked"
  | "timeout"
  | "executor_error";

export interface RuntimeExecutionResult {
  success: boolean;
  runtimeId: string;
  actionId: string;
  output?: JsonValue;
  error?: string;
  failureReason?: RuntimeExecutionFailureReason;
  durationMs?: number;
}

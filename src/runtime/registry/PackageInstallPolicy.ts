import type { RuntimePackageInstallPolicy, InstallPolicyAction } from "./PackageRegistryTypes";
import type { AxpkgTrustLevel } from "../../app/projects/axpkg/AxpkgSignatureTypes";

export const DEFAULT_RUNTIME_PACKAGE_INSTALL_POLICY: RuntimePackageInstallPolicy = {
  trusted: "allow",
  unsigned: "confirm",
  untrusted: "confirm",
  tampered: "block",
  incompatible: "block",
  blocked: "block",
};

export function resolveInstallPolicyAction(
  level: AxpkgTrustLevel,
  policy?: RuntimePackageInstallPolicy
): InstallPolicyAction {
  const p = policy ?? DEFAULT_RUNTIME_PACKAGE_INSTALL_POLICY;
  switch (level) {
    case "trusted":
      return p.trusted;
    case "unsigned":
      return p.unsigned;
    case "untrusted":
      return p.untrusted;
    case "tampered":
      return p.tampered;
    case "incompatible":
      return p.incompatible;
    case "blocked":
      return p.blocked;
    default:
      return "block";
  }
}

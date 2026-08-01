import type { RuntimePackagePromotionPolicy, RuntimePackagePromotionAction } from "./PackageRegistryTypes";
import type { AxpkgTrustLevel } from "../../app/projects/axpkg/AxpkgSignatureTypes";

export const DEFAULT_RUNTIME_PACKAGE_PROMOTION_POLICY: RuntimePackagePromotionPolicy = {
  trusted: "allow",
  unsigned: "block",
  untrusted: "block",
  tampered: "block",
  incompatible: "block",
  blocked: "block",
};

export function resolvePromotionPolicyAction(
  level: AxpkgTrustLevel,
  policy?: RuntimePackagePromotionPolicy
): RuntimePackagePromotionAction {
  const p = policy ?? DEFAULT_RUNTIME_PACKAGE_PROMOTION_POLICY;
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


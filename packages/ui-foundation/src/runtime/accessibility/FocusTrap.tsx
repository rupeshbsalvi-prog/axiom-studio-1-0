import * as React from "react";
import { FocusScopeContext } from "./FocusScope";
import { FocusManager } from "./FocusManager";
import { FOCUSABLE_SELECTOR } from "../accessibility";
import { ComponentMetadata } from "../../contracts/ComponentProps";

export interface FocusTrapProps {
  children?: React.ReactNode;
  active?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> & {
  metadata?: ComponentMetadata;
} = ({ children, active = true }) => {
  const scope = React.useContext(FocusScopeContext);

  React.useEffect(() => {
    if (!active || !scope) return;

    const container = scope.containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (!FocusManager.isTop(scope.id)) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [scope, active]);

  return <>{children}</>;
};

FocusTrap.displayName = "FocusTrap";
FocusTrap.metadata = {
  name: "FocusTrap",
  package: "@axiom/ui-foundation",
  since: "0.4.0",
  maturity: "L3",
  accessibility: "AA",
  category: "infrastructure",
  tokens: [],
  dependencies: ["FocusScope", "FocusManager"],
  status: "stable",
};

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean = true
): void {
  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, active]);
}

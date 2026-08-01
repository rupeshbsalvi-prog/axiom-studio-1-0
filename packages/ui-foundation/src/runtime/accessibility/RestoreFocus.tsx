import * as React from "react";
import { ComponentMetadata } from "../../contracts/ComponentProps";

export interface RestoreFocusProps {
  children?: React.ReactNode;
  active?: boolean;
}

export const RestoreFocus: React.FC<RestoreFocusProps> & {
  metadata?: ComponentMetadata;
} = ({ children, active = true }) => {
  const restoreElRef = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    if (active && typeof document !== "undefined") {
      restoreElRef.current = document.activeElement as HTMLElement;
    }
    return () => {
      if (active && restoreElRef.current) {
        restoreElRef.current.focus();
      }
    };
  }, [active]);

  return <>{children}</>;
};

RestoreFocus.displayName = "RestoreFocus";
RestoreFocus.metadata = {
  name: "RestoreFocus",
  package: "@axiom/ui-foundation",
  since: "0.4.0",
  maturity: "L3",
  accessibility: "AA",
  category: "infrastructure",
  tokens: [],
  dependencies: [],
  status: "stable",
};

export function useRestoreFocus(active: boolean = true): void {
  const restoreElRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (active && typeof document !== "undefined") {
      restoreElRef.current = document.activeElement as HTMLElement;
    }
    return () => {
      if (active && restoreElRef.current) {
        restoreElRef.current.focus();
      }
    };
  }, [active]);
}

export function usePreviousFocus(): HTMLElement | null {
  const [previousFocus, setPreviousFocus] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let currentFocus = document.activeElement as HTMLElement | null;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target !== currentFocus) {
        setPreviousFocus(currentFocus);
        currentFocus = target;
      }
    };

    window.addEventListener("focusin", handleFocusIn);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  return previousFocus;
}

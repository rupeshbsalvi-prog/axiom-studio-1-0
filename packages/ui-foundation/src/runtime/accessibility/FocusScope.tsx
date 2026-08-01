import * as React from "react";
import { FocusManager } from "./FocusManager";
import { useId } from "../accessibility";
import { ComponentMetadata } from "../../contracts/ComponentProps";

export interface FocusScopeProps {
  children: React.ReactNode;
  autoFocus?: boolean;
}

export const FocusScopeContext = React.createContext<{
  id: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

export const FocusScope: React.FC<FocusScopeProps> & {
  metadata?: ComponentMetadata;
} = ({ children, autoFocus = false }) => {
  const id = useId();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    FocusManager.register(id, containerRef.current);
    return () => {
      FocusManager.unregister(id);
    };
  }, [id]);

  React.useEffect(() => {
    FocusManager.updateElement(id, containerRef.current);
  });

  React.useEffect(() => {
    if (autoFocus && containerRef.current) {
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0]?.focus();
      }
    }
  }, [autoFocus]);

  return (
    <FocusScopeContext.Provider value={{ id, containerRef }}>
      <div ref={containerRef} style={{ display: "contents" }}>
        {children}
      </div>
    </FocusScopeContext.Provider>
  );
};

FocusScope.displayName = "FocusScope";
FocusScope.metadata = {
  name: "FocusScope",
  package: "@axiom/ui-foundation",
  since: "0.4.0",
  maturity: "L3",
  accessibility: "AA",
  category: "infrastructure",
  tokens: [],
  dependencies: ["FocusManager"],
  status: "stable",
};

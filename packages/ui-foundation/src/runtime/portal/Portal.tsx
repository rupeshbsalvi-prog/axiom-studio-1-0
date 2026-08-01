import * as React from "react";
import * as ReactDOM from "react-dom";
import { ComponentMetadata } from "../../contracts/ComponentProps";

export interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement | (() => HTMLElement | null) | null;
}

export const Portal: React.FC<PortalProps> & {
  metadata?: ComponentMetadata;
} = ({ children, container }) => {
  const [mountNode, setMountNode] = React.useState<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return;

    if (!container) {
      setMountNode(document.body);
      return;
    }

    const targetNode = typeof container === "function" ? container() : container;
    setMountNode(targetNode || document.body);
  }, [container]);

  if (!mountNode) return null;

  return ReactDOM.createPortal(children, mountNode);
};

Portal.displayName = "Portal";
Portal.metadata = {
  name: "Portal",
  package: "@axiom/ui-foundation",
  since: "0.4.0",
  maturity: "L3",
  accessibility: "AA",
  category: "infrastructure",
  tokens: [],
  dependencies: [],
  status: "stable",
};

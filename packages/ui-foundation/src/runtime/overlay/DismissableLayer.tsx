import * as React from "react";
import { OverlayManager, OverlayOptions } from "./OverlayManager";
import { useId } from "../accessibility";
import { ComponentMetadata } from "../../contracts/ComponentProps";

export interface DismissableLayerProps extends OverlayOptions {
  children: React.ReactNode;
  onDismiss: () => void;
}

export const DismissableLayer: React.FC<DismissableLayerProps> & {
  metadata?: ComponentMetadata;
} = ({
  children,
  onDismiss,
  zIndex = 1000,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  lockScroll = false,
  restoreFocus = true,
}) => {
  const id = useId("dismissable");
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    OverlayManager.register(id, {
      zIndex,
      closeOnEscape,
      closeOnOutsideClick,
      lockScroll,
      restoreFocus,
      onDismiss,
      element: ref.current,
    });

    return () => {
      OverlayManager.unregister(id);
    };
  }, [id, zIndex, closeOnEscape, closeOnOutsideClick, lockScroll, restoreFocus, onDismiss]);

  React.useEffect(() => {
    OverlayManager.update(id, { element: ref.current });
  });

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
};

DismissableLayer.displayName = "DismissableLayer";
DismissableLayer.metadata = {
  name: "DismissableLayer",
  package: "@axiom/ui-foundation",
  since: "0.4.0",
  maturity: "L3",
  accessibility: "AA",
  category: "infrastructure",
  tokens: [],
  dependencies: ["OverlayManager"],
  status: "stable",
};

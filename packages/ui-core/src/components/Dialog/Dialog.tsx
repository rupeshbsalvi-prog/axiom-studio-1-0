import * as React from "react";
import {
  Portal,
  RestoreFocus,
  FocusScope,
  FocusTrap,
  DismissableLayer,
  useId,
  ComponentMetadata,
} from "@axiom/ui-foundation";
import { colors, radius, spacing, typography } from "@axiom/tokens";

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith("rgba")) return hex;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog compound components must be rendered within a <Dialog /> component.");
  }
  return context;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> & {
  displayName?: string;
  metadata?: ComponentMetadata;
} = ({ open, onOpenChange, children }) => {
  const titleId = useId("dialog-title");
  const descriptionId = useId("dialog-desc");

  return (
    <DialogContext.Provider value={{ open, onOpenChange, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
};

Dialog.displayName = "Dialog";
Dialog.metadata = {
  name: "Dialog",
  package: "@axiom/ui-core",
  since: "0.4.0",
  maturity: "L3",
  accessibility: "AA",
  category: "feedback",
  tokens: ["elevation"],
  dependencies: ["Portal", "FocusScope", "FocusTrap", "RestoreFocus", "DismissableLayer"],
  status: "stable",
};

export interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogOverlay: React.FC<DialogOverlayProps> = ({ style, ...props }) => {
  const { open, onOpenChange } = useDialogContext();

  if (!open) return null;

  const defaultStyle: React.CSSProperties = {
    position: "fixed",
    inset: spacing.none,
    backgroundColor: hexToRgba(colors.background, 0.4),
    backdropFilter: "blur(4px)",
    zIndex: 399,
  };

  return (
    <Portal>
      <div
        data-testid="dialog-overlay"
        style={{ ...defaultStyle, ...style }}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    </Portal>
  );
};

DialogOverlay.displayName = "DialogOverlay";

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, style, ...props }) => {
  const { open, onOpenChange, titleId, descriptionId } = useDialogContext();

  if (!open) return null;

  const defaultStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: spacing.xl,
    backgroundColor: hexToRgba(colors.background, 0.95),
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    zIndex: 400,
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
    minWidth: "320px",
    maxWidth: "480px",
    color: colors.text,
    backdropFilter: "blur(16px)",
  };

  return (
    <Portal>
      <RestoreFocus>
        <FocusScope autoFocus>
          <FocusTrap>
            <DismissableLayer
              zIndex={400}
              lockScroll
              onDismiss={() => onOpenChange(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                data-testid="dialog-content"
                style={{ ...defaultStyle, ...style }}
                {...props}
              >
                {children}
              </div>
            </DismissableLayer>
          </FocusTrap>
        </FocusScope>
      </RestoreFocus>
    </Portal>
  );
};

DialogContent.displayName = "DialogContent";

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, style, ...props }) => {
  const { titleId } = useDialogContext();

  const defaultStyle: React.CSSProperties = {
    margin: spacing.none,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  };

  return (
    <h2 id={titleId} style={{ ...defaultStyle, ...style }} {...props}>
      {children}
    </h2>
  );
};

DialogTitle.displayName = "DialogTitle";

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, style, ...props }) => {
  const { descriptionId } = useDialogContext();

  const defaultStyle: React.CSSProperties = {
    margin: spacing.none,
    fontSize: typography.fontSizes.sm,
    color: hexToRgba(colors.text, 0.7),
  };

  return (
    <p id={descriptionId} style={{ ...defaultStyle, ...style }} {...props}>
      {children}
    </p>
  );
};

DialogDescription.displayName = "DialogDescription";

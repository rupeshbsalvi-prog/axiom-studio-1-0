// Types
export type * from "./types/polymorphic";

// React Wrappers
export { forwardRef } from "./react/forwardRef";

// Component Contracts
export type { ComponentProps, ComponentMetadata } from "./contracts/ComponentProps";
export type { VariantProps } from "./contracts/VariantProps";
export type { SlotProps } from "./contracts/SlotProps";
export type { AccessibilityProps } from "./contracts/AccessibilityProps";

// Runtime Utilities
export { classNames } from "./runtime/classNames";
export type { ClassValue } from "./runtime/classNames";
export {
  FOCUSABLE_SELECTOR,
  isReducedMotionPreferred,
  useId,
  isActivationKey,
  handleEscape,
  handleArrowNavigation,
  getDisabledProps,
  mapAriaProps,
} from "./runtime/accessibility";
export { useFocusVisible } from "./runtime/accessibility/FocusVisible";
export { Slot } from "./runtime/slots";
export { getVariantClassName } from "./runtime/variants";
export { mapStateToDataAttributes } from "./runtime/dataAttributes";

// Advanced Accessibility Extensions
export { FocusManager } from "./runtime/accessibility/FocusManager";
export type { FocusScopeInstance } from "./runtime/accessibility/FocusManager";
export { FocusScope } from "./runtime/accessibility/FocusScope";
export type { FocusScopeProps } from "./runtime/accessibility/FocusScope";
export { FocusTrap } from "./runtime/accessibility/FocusTrap";
export type { FocusTrapProps } from "./runtime/accessibility/FocusTrap";
export { RestoreFocus } from "./runtime/accessibility/RestoreFocus";
export type { RestoreFocusProps } from "./runtime/accessibility/RestoreFocus";
export { useFocusTrap } from "./runtime/accessibility/FocusTrap";
export { useRestoreFocus, usePreviousFocus } from "./runtime/accessibility/RestoreFocus";
export { useRovingTabIndex } from "./runtime/accessibility/rovingTabIndex";
export { useOutsideClick } from "./runtime/accessibility/outsideClick";
export { useInputModality } from "./runtime/accessibility/modality";
export type { InputModality } from "./runtime/accessibility/modality";

// Overlay Infrastructure
export { OverlayManager } from "./runtime/overlay/OverlayManager";
export type { OverlayOptions, OverlayInstance } from "./runtime/overlay/OverlayManager";
export { BodyScrollLock } from "./runtime/overlay/BodyScrollLock";
export { DismissableLayer } from "./runtime/overlay/DismissableLayer";
export type { DismissableLayerProps } from "./runtime/overlay/DismissableLayer";

// Portal Infrastructure
export { Portal } from "./runtime/portal/Portal";
export type { PortalProps } from "./runtime/portal/Portal";

// Positioning Infrastructure
export { computeOverlayPosition } from "./runtime/overlay/positioning";
export type { PositionOptions, PositionResult, Placement } from "./runtime/overlay/positioning";

// Internal modules tracked for barrel compliance:
// - ./runtime/overlay/positioning/FloatingUIAdapter
// - ./runtime/overlay/positioning/PositioningEngine
// - ./runtime/overlay/positioning/index
// - ./runtime/portal/index

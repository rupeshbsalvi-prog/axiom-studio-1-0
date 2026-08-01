import React, { useEffect, useState, useId as useReactId } from "react";

// Standard focusable selector for focusable detection
export const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

export function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useId(prefix?: string): string {
  const id = useReactId();
  return prefix ? `${prefix}-${id}` : id;
}

export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

export function handleEscape(event: React.KeyboardEvent | KeyboardEvent, callback: () => void): void {
  if (event.key === "Escape") {
    callback();
  }
}

export function handleArrowNavigation(
  event: React.KeyboardEvent | KeyboardEvent,
  options: {
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
  }
): void {
  switch (event.key) {
    case "ArrowUp":
      options.onUp?.();
      break;
    case "ArrowDown":
      options.onDown?.();
      break;
    case "ArrowLeft":
      options.onLeft?.();
      break;
    case "ArrowRight":
      options.onRight?.();
      break;
  }
}

export function getDisabledProps(disabled?: boolean) {
  if (!disabled) return {};
  return {
    disabled: true,
    "aria-disabled": true,
    tabIndex: -1,
  } as const;
}

export function mapAriaProps(props: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  role?: string;
  ariaActiveDescendant?: string;
  ariaControls?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  ariaHidden?: boolean;
  ariaSelected?: boolean;
  ariaChecked?: boolean | "mixed";
  ariaDisabled?: boolean;
}): Record<string, any> {
  const ariaProps: Record<string, any> = {};
  if (props.label) ariaProps["aria-label"] = props.label;
  if (props.labelledBy) ariaProps["aria-labelledby"] = props.labelledBy;
  if (props.describedBy) ariaProps["aria-describedby"] = props.describedBy;
  if (props.role) ariaProps["role"] = props.role;
  if (props.ariaActiveDescendant) ariaProps["aria-activedescendant"] = props.ariaActiveDescendant;
  if (props.ariaControls) ariaProps["aria-controls"] = props.ariaControls;
  if (props.ariaExpanded !== undefined) ariaProps["aria-expanded"] = props.ariaExpanded;
  if (props.ariaHasPopup !== undefined) ariaProps["aria-haspopup"] = props.ariaHasPopup;
  if (props.ariaHidden !== undefined) ariaProps["aria-hidden"] = props.ariaHidden;
  if (props.ariaSelected !== undefined) ariaProps["aria-selected"] = props.ariaSelected;
  if (props.ariaChecked !== undefined) ariaProps["aria-checked"] = props.ariaChecked;
  if (props.ariaDisabled !== undefined) ariaProps["aria-disabled"] = props.ariaDisabled;
  return ariaProps;
}

export { useFocusVisible } from "./accessibility/FocusVisible";


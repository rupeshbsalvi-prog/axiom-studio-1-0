export interface AccessibilityProps {
  label?: string;            // maps to aria-label
  labelledBy?: string;       // maps to aria-labelledby
  describedBy?: string;      // maps to aria-describedby
  role?: string;
  tabIndex?: number;
  ariaActiveDescendant?: string;
  ariaControls?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  ariaHidden?: boolean;
  ariaSelected?: boolean;
  ariaChecked?: boolean | "mixed";
  ariaDisabled?: boolean;
}

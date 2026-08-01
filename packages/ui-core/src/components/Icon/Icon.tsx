import React from "react";
import { colors } from "@axiom/tokens";
import { forwardRef, classNames, ComponentMetadata } from "@axiom/ui-foundation";
import { ICON_REGISTRY, type IconName } from "./registry";

export interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string; // maps to colors key, e.g. "primary", or standard CSS color
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon = forwardRef<IconProps, "svg">(
  ({ name, size = 24, color = "currentColor", label, className, style, ...props }: IconProps, ref: React.Ref<any>) => {
    const iconRenderer = ICON_REGISTRY[name];
    if (!iconRenderer) {
      console.warn(`Icon "${name}" not found in registry.`);
      return null;
    }

    const resolvedSize = typeof size === "number" ? `${size}px` : size;
    const resolvedColor = (colors as any)[color] || color;

    const baseStyle: React.CSSProperties = {
      display: "inline-block",
      verticalAlign: "middle",
      width: resolvedSize,
      height: resolvedSize,
      color: resolvedColor,
      flexShrink: 0,
    };

    const spinAnimation = name === "spinner"
      ? {
          animation: "ax-spin 1s linear infinite",
          transformOrigin: "center",
        }
      : {};

    const mergedStyle: React.CSSProperties = {
      ...baseStyle,
      ...spinAnimation,
      ...style,
    };

    const ariaProps: React.SVGAttributes<SVGElement> = label
      ? { role: "img", "aria-label": label }
      : { "aria-hidden": true };

    return (
      <>
        {name === "spinner" && (
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes ax-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        )}
        <svg
          ref={ref}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={classNames("ax-icon", `ax-icon--${name}`, className)}
          style={mergedStyle}
          {...ariaProps}
          {...props}
        >
          {iconRenderer()}
        </svg>
      </>
    );
  }
);

(Icon as any).displayName = "Icon";
(Icon as any).metadata = {
  name: "Icon",
  package: "@axiom/ui-core",
  since: "0.1.0",
  maturity: "L4",
  accessibility: "AA",
  category: "outputs",
  tokens: ["colors"],
  dependencies: [],
  status: "stable",
} as ComponentMetadata;

export type { IconName };

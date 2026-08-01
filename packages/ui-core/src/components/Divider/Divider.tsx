import React from "react";
import { colors, spacing } from "@axiom/tokens";
import { forwardRef, classNames, ComponentMetadata } from "@axiom/ui-foundation";

export interface DividerProps {
  as?: React.ElementType;
  orientation?: "horizontal" | "vertical";
  label?: React.ReactNode;
  spacing?: "none" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Divider = forwardRef<DividerProps, "hr">(
  (
    {
      as,
      orientation = "horizontal",
      label,
      spacing: spacingProp = "none",
      className,
      style,
      children,
      ...props
    }: DividerProps,
    ref: React.Ref<any>
  ) => {
    const Tag = as || (label ? "div" : "hr");
    const marginValue = spacing[spacingProp] || "0rem";

    const baseStyle: React.CSSProperties = {
      boxSizing: "border-box",
      border: "none",
      margin: 0,
    };

    let layoutStyle: React.CSSProperties = {};

    if (orientation === "horizontal") {
      layoutStyle = {
        width: "100%",
        marginTop: marginValue,
        marginBottom: marginValue,
      };
      if (label) {
        layoutStyle = {
          ...layoutStyle,
          display: "flex",
          alignItems: "center",
          textAlign: "center",
        };
      } else {
        layoutStyle = {
          ...layoutStyle,
          height: "1px",
          backgroundColor: colors.border,
        };
      }
    } else {
      layoutStyle = {
        height: "100%",
        alignSelf: "stretch",
        marginLeft: marginValue,
        marginRight: marginValue,
      };
      if (label) {
        layoutStyle = {
          ...layoutStyle,
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
        };
      } else {
        layoutStyle = {
          ...layoutStyle,
          width: "1px",
          backgroundColor: colors.border,
        };
      }
    }

    const mergedStyle: React.CSSProperties = {
      ...baseStyle,
      ...layoutStyle,
      ...style,
    };

    const lineStyle: React.CSSProperties = {
      flexGrow: 1,
      border: "none",
      margin: 0,
      backgroundColor: colors.border,
      ...(orientation === "horizontal"
        ? { height: "1px" }
        : { width: "1px" }),
    };

    const labelStyle: React.CSSProperties = {
      padding: orientation === "horizontal" ? `0 ${spacing.sm}` : `${spacing.xs} 0`,
      color: colors.muted,
      fontSize: "0.875rem",
      whiteSpace: "nowrap",
    };

    if (!label) {
      return (
        <Tag
          ref={ref}
          role="separator"
          aria-orientation={orientation}
          className={classNames("ax-divider", `ax-divider--${orientation}`, className)}
          style={mergedStyle}
          {...props}
        />
      );
    }

    return (
      <Tag
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={classNames("ax-divider", "ax-divider--labeled", `ax-divider--${orientation}`, className)}
        style={mergedStyle}
        {...props}
      >
        <div style={lineStyle} />
        <span className="ax-divider__label" style={labelStyle}>
          {label}
        </span>
        <div style={lineStyle} />
      </Tag>
    );
  }
);

(Divider as any).displayName = "Divider";
(Divider as any).metadata = {
  name: "Divider",
  package: "@axiom/ui-core",
  since: "0.1.0",
  maturity: "L4",
  accessibility: "AA",
  category: "layout",
  tokens: ["colors", "spacing"],
  dependencies: [],
  status: "stable",
} as ComponentMetadata;

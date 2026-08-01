import React from "react";
import { colors, radius, typography, spacing } from "@axiom/tokens";
import { forwardRef, classNames, ComponentMetadata } from "@axiom/ui-foundation";
import { Icon, type IconName } from "../Icon/Icon";

export interface BadgeProps {
  as?: React.ElementType;
  variant?: "neutral" | "optimal" | "warning" | "error" | "info";
  size?: "sm" | "md";
  dot?: boolean;
  icon?: IconName;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith("rgba")) return hex;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const Badge = forwardRef<BadgeProps, "span">(
  (
    {
      as: Tag = "span",
      variant = "neutral",
      size = "md",
      dot = false,
      icon,
      className,
      style,
      children,
      ...props
    }: BadgeProps,
    ref: React.Ref<any>
  ) => {
    let textCol: string;
    let bgCol: string;
    let borderCol: string;

    switch (variant) {
      case "optimal":
        textCol = colors.optimal;
        bgCol = hexToRgba(colors.optimal, 0.1);
        borderCol = hexToRgba(colors.optimal, 0.2);
        break;
      case "warning":
        textCol = colors.attention;
        bgCol = hexToRgba(colors.attention, 0.1);
        borderCol = hexToRgba(colors.attention, 0.2);
        break;
      case "error":
        textCol = colors.critical;
        bgCol = hexToRgba(colors.critical, 0.1);
        borderCol = hexToRgba(colors.critical, 0.2);
        break;
      case "info":
        textCol = colors.primary;
        bgCol = hexToRgba(colors.primary, 0.1);
        borderCol = hexToRgba(colors.primary, 0.2);
        break;
      case "neutral":
      default:
        textCol = colors.muted;
        bgCol = hexToRgba(colors.muted, 0.08);
        borderCol = colors.border;
        break;
    }

    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      borderRadius: radius.full,
      fontWeight: typography.fontWeights.medium,
      fontFamily: typography.fonts.body,
      color: textCol,
      backgroundColor: bgCol,
      border: `1px solid ${borderCol}`,
      lineHeight: 1,
      whiteSpace: "nowrap",
    };

    const sizeStyle: React.CSSProperties =
      size === "sm"
        ? {
            fontSize: typography.fontSizes.xs,
            padding: `calc(${spacing.xxs} / 2) ${spacing.xs}`,
            height: "1.25rem",
            gap: spacing.xxs,
          }
        : {
            fontSize: typography.fontSizes.sm,
            padding: `${spacing.xxs} ${spacing.sm}`,
            height: "1.625rem",
            gap: `calc(${spacing.xxs} + 2px)`,
          };

    const mergedStyle: React.CSSProperties = {
      ...baseStyle,
      ...sizeStyle,
      ...style,
    };

    const dotStyle: React.CSSProperties = {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      backgroundColor: textCol,
      flexShrink: 0,
    };

    const iconSize = size === "sm" ? 12 : 14;

    return (
      <Tag
        ref={ref}
        className={classNames("ax-badge", `ax-badge--${variant}`, `ax-badge--${size}`, className)}
        style={mergedStyle}
        {...props}
      >
        {icon && <Icon name={icon} size={iconSize} color="currentColor" />}
        {!icon && dot && <span className="ax-badge__dot" style={dotStyle} data-testid="badge-dot" />}
        <span>{children}</span>
      </Tag>
    );
  }
);

(Badge as any).displayName = "Badge";
(Badge as any).metadata = {
  name: "Badge",
  package: "@axiom/ui-core",
  since: "0.1.0",
  maturity: "L4",
  accessibility: "AA",
  category: "outputs",
  tokens: ["colors", "radius", "typography"],
  dependencies: ["Icon"],
  status: "stable",
} as ComponentMetadata;

import React from "react";
import { colors, typography } from "@axiom/tokens";
import { forwardRef, classNames } from "@axiom/ui-foundation";

export interface TextProps {
  as?: React.ElementType;
  variant?: "body" | "caption" | "label" | "title" | "display" | "hero" | "mono";
  color?: "text" | "muted" | "optimal" | "attention" | "critical" | "primary" | "highlight";
  align?: "left" | "center" | "right" | "justify";
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Text = forwardRef<TextProps, "span">(
  ({ as: Tag = "span", variant = "body", color, align, className, style, children, ...props }: TextProps, ref: React.Ref<any>) => {
    
    let fontStyle: React.CSSProperties = {};

    switch (variant) {
      case "caption":
        fontStyle = {
          fontFamily: typography.fonts.body,
          fontSize: typography.fontSizes.xs,
          fontWeight: typography.fontWeights.regular,
          color: colors.muted,
        };
        break;
      case "label":
        fontStyle = {
          fontFamily: typography.fonts.body,
          fontSize: typography.fontSizes.sm,
          fontWeight: typography.fontWeights.semibold,
          color: colors.text,
        };
        break;
      case "title":
        fontStyle = {
          fontFamily: typography.fonts.heading,
          fontSize: typography.fontSizes.xl,
          fontWeight: typography.fontWeights.bold,
          color: colors.text,
          letterSpacing: typography.letterSpacings.tight,
        };
        break;
      case "display":
        fontStyle = {
          fontFamily: typography.fonts.heading,
          fontSize: typography.fontSizes.display,
          fontWeight: typography.fontWeights.bold,
          color: colors.text,
          letterSpacing: typography.letterSpacings.tight,
          lineHeight: typography.lineHeights.tight,
        };
        break;
      case "hero":
        fontStyle = {
          fontFamily: typography.fonts.heading,
          fontSize: typography.fontSizes.hero,
          fontWeight: typography.fontWeights.extrabold,
          color: colors.primary,
          letterSpacing: typography.letterSpacings.tight,
          lineHeight: typography.lineHeights.none,
        };
        break;
      case "mono":
        fontStyle = {
          fontFamily: typography.fonts.mono,
          fontSize: typography.fontSizes.sm,
          fontWeight: typography.fontWeights.regular,
          color: colors.highlight,
        };
        break;
      case "body":
      default:
        fontStyle = {
          fontFamily: typography.fonts.body,
          fontSize: typography.fontSizes.md,
          fontWeight: typography.fontWeights.regular,
          color: colors.text,
        };
        break;
    }

    const overrides: React.CSSProperties = {};
    if (color) {
      overrides.color = colors[color];
    }
    if (align) {
      overrides.textAlign = align;
    }

    const mergedStyle: React.CSSProperties = {
      margin: 0,
      ...fontStyle,
      ...overrides,
      ...style,
    };

    return (
      <Tag
        ref={ref}
        className={classNames("ax-text", `ax-text--${variant}`, className)}
        style={mergedStyle}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

(Text as any).displayName = "Text";

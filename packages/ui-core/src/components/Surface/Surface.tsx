import React from "react";
import { colors, radius, elevation } from "@axiom/tokens";
import { forwardRef, classNames } from "@axiom/ui-foundation";

export interface SurfaceProps {
  as?: React.ElementType;
  variant?: "default" | "glass" | "elevated" | "outline" | "interactive";
  glowing?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Surface = forwardRef<SurfaceProps, "div">(
  ({ as: Tag = "div", variant = "default", glowing = false, className, style, children, ...props }: SurfaceProps, ref: React.Ref<any>) => {
    
    const baseStyle: React.CSSProperties = {
      boxSizing: "border-box",
      borderRadius: radius.md,
    };

    let variantStyle: React.CSSProperties = {};

    switch (variant) {
      case "glass":
        variantStyle = {
          backdropFilter: elevation.glassmorphism.panel.backdropFilter,
          WebkitBackdropFilter: elevation.glassmorphism.panel.backdropFilter,
          background: elevation.glassmorphism.panel.background,
          border: elevation.glassmorphism.panel.border,
        };
        break;
      case "elevated":
        variantStyle = {
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          boxShadow: elevation.shadows.md,
        };
        break;
      case "outline":
        variantStyle = {
          backgroundColor: "transparent",
          border: `1px solid ${colors.border}`,
        };
        break;
      case "interactive":
        variantStyle = {
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          cursor: "pointer",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
        };
        break;
      case "default":
      default:
        variantStyle = {
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
        };
        break;
    }

    const glowStyle: React.CSSProperties = glowing
      ? {
          boxShadow: elevation.shadows.glow,
          borderColor: colors.primary,
        }
      : {};

    const mergedStyle: React.CSSProperties = {
      ...baseStyle,
      ...variantStyle,
      ...glowStyle,
      ...style,
    };

    return (
      <Tag
        ref={ref}
        className={classNames("ax-surface", `ax-surface--${variant}`, className)}
        style={mergedStyle}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

(Surface as any).displayName = "Surface";

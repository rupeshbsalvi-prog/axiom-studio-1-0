import React, { useState } from "react";
import { colors, radius, typography, elevation, spacing } from "@axiom/tokens";
import { forwardRef, classNames, ComponentMetadata } from "@axiom/ui-foundation";
import { Icon } from "../Icon/Icon";

export interface ButtonProps extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  as?: React.ElementType;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: string;
  rel?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith("rgba")) return hex;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const Button = forwardRef<ButtonProps, "button">(
  (
    {
      as,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "start",
      disabled = false,
      className,
      style,
      children,
      ...props
    }: ButtonProps,
    ref: React.Ref<any>
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const Tag = as || (props.href ? "a" : "button");
    const isInteractionDisabled = disabled || loading;

    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      borderRadius: radius.md,
      fontWeight: typography.fontWeights.medium,
      fontFamily: typography.fonts.body,
      border: "1px solid transparent",
      cursor: isInteractionDisabled ? "not-allowed" : "pointer",
      transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease, opacity 0.2s ease",
      outline: "none",
      textDecoration: "none",
      userSelect: "none",
      whiteSpace: "nowrap",
      opacity: disabled ? 0.5 : 1,
      transform: isActive && !isInteractionDisabled ? "scale(0.98)" : "none",
    };

    let sizeStyle: React.CSSProperties = {};
    switch (size) {
      case "sm":
        sizeStyle = {
          fontSize: typography.fontSizes.xs,
          padding: `calc(${spacing.xxs} + 2px) ${spacing.sm}`,
          height: "1.75rem",
          gap: spacing.xxs,
        };
        break;
      case "lg":
        sizeStyle = {
          fontSize: typography.fontSizes.md,
          padding: `${spacing.sm} calc(${spacing.sm} + ${spacing.md})`,
          height: "2.75rem",
          gap: spacing.xs,
        };
        break;
      case "md":
      default:
        sizeStyle = {
          fontSize: typography.fontSizes.sm,
          padding: `${spacing.xs} ${spacing.lg}`,
          height: "2.25rem",
          gap: `calc(${spacing.xxs} + 2px)`,
        };
        break;
    }

    let variantStyle: React.CSSProperties = {};

    switch (variant) {
      case "primary":
        variantStyle = {
          backgroundColor: colors.primary,
          color: colors.background,
          borderColor: colors.primary,
          boxShadow: elevation.shadows.sm,
        };
        if (!isInteractionDisabled) {
          if (isActive) {
            variantStyle.backgroundColor = hexToRgba(colors.primary, 0.75);
            variantStyle.borderColor = hexToRgba(colors.primary, 0.75);
          } else if (isHovered) {
            variantStyle.backgroundColor = hexToRgba(colors.primary, 0.88);
            variantStyle.borderColor = hexToRgba(colors.primary, 0.88);
            variantStyle.boxShadow = elevation.shadows.glow;
          }
        }
        if (isFocused) {
          variantStyle.boxShadow = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.primary}`;
        }
        break;

      case "secondary":
        variantStyle = {
          backgroundColor: hexToRgba(colors.text, 0.04),
          color: colors.text,
          borderColor: colors.border,
        };
        if (!isInteractionDisabled) {
          if (isActive) {
            variantStyle.backgroundColor = hexToRgba(colors.text, 0.02);
          } else if (isHovered) {
            variantStyle.backgroundColor = hexToRgba(colors.text, 0.08);
            variantStyle.borderColor = colors.muted;
          }
        }
        if (isFocused) {
          variantStyle.boxShadow = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.primary}`;
        }
        break;

      case "ghost":
        variantStyle = {
          backgroundColor: "transparent",
          color: colors.muted,
          borderColor: "transparent",
        };
        if (!isInteractionDisabled) {
          if (isActive) {
            variantStyle.backgroundColor = hexToRgba(colors.text, 0.02);
          } else if (isHovered) {
            variantStyle.backgroundColor = hexToRgba(colors.text, 0.04);
            variantStyle.color = colors.text;
          }
        }
        if (isFocused) {
          variantStyle.boxShadow = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.primary}`;
        }
        break;

      case "destructive":
        variantStyle = {
          backgroundColor: colors.critical,
          color: colors.text,
          borderColor: colors.critical,
          boxShadow: elevation.shadows.sm,
        };
        if (!isInteractionDisabled) {
          if (isActive) {
            variantStyle.backgroundColor = hexToRgba(colors.critical, 0.75);
            variantStyle.borderColor = hexToRgba(colors.critical, 0.75);
          } else if (isHovered) {
            variantStyle.backgroundColor = hexToRgba(colors.critical, 0.88);
            variantStyle.borderColor = hexToRgba(colors.critical, 0.88);
          }
        }
        if (isFocused) {
          variantStyle.boxShadow = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.critical}`;
        }
        break;
    }

    const mergedStyle: React.CSSProperties = {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<any>) => {
      if (isInteractionDisabled) return;
      setIsHovered(true);
      if (props.onMouseEnter) props.onMouseEnter(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<any>) => {
      if (isInteractionDisabled) return;
      setIsHovered(false);
      setIsActive(false);
      if (props.onMouseLeave) props.onMouseLeave(e);
    };

    const handleMouseDown = (e: React.MouseEvent<any>) => {
      if (isInteractionDisabled) return;
      setIsActive(true);
      if (props.onMouseDown) props.onMouseDown(e);
    };

    const handleMouseUp = (e: React.MouseEvent<any>) => {
      if (isInteractionDisabled) return;
      setIsActive(false);
      if (props.onMouseUp) props.onMouseUp(e);
    };

    const handleFocus = (e: React.FocusEvent<any>) => {
      if (isInteractionDisabled) return;
      setIsFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<any>) => {
      setIsFocused(false);
      if (props.onBlur) props.onBlur(e);
    };

    const handleClick = (e: React.MouseEvent<any>) => {
      if (isInteractionDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (props.onClick) props.onClick(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<any>) => {
      if (isInteractionDisabled) return;
      if (e.key === " " || e.key === "Enter") {
        setIsActive(true);
      }
      if (props.onKeyDown) props.onKeyDown(e);
    };

    const handleKeyUp = (e: React.KeyboardEvent<any>) => {
      if (isInteractionDisabled) return;
      if (e.key === " " || e.key === "Enter") {
        setIsActive(false);
      }
      if (props.onKeyUp) props.onKeyUp(e);
    };

    const ariaProps: Record<string, any> = {
      "aria-disabled": isInteractionDisabled ? "true" : undefined,
      "aria-busy": loading ? "true" : undefined,
    };

    if (Tag !== "button") {
      ariaProps.role = "button";
      ariaProps.tabIndex = isInteractionDisabled ? -1 : 0;
    }

    const htmlDisabled = Tag === "button" && disabled ? true : undefined;
    const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

    const renderIcon = () => {
      if (loading) {
        return <Icon name="spinner" size={iconSize} color="currentColor" />;
      }
      return icon;
    };

    const renderedIcon = renderIcon();

    return (
      <Tag
        ref={ref}
        disabled={htmlDisabled}
        {...props}
        className={classNames(
          "ax-button",
          `ax-button--${variant}`,
          `ax-button--${size}`,
          loading && "ax-button--loading",
          disabled && "ax-button--disabled",
          className
        )}
        style={mergedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        {...ariaProps}
      >
        {renderedIcon && iconPosition === "start" && renderedIcon}
        {children && <span>{children}</span>}
        {renderedIcon && iconPosition === "end" && !loading && renderedIcon}
      </Tag>
    );
  }
);

(Button as any).displayName = "Button";
(Button as any).metadata = {
  name: "Button",
  package: "@axiom/ui-core",
  since: "0.1.0",
  maturity: "L4",
  accessibility: "AA",
  category: "inputs",
  tokens: ["colors", "radius", "typography", "elevation"],
  dependencies: ["Icon"],
  status: "stable",
} as ComponentMetadata;

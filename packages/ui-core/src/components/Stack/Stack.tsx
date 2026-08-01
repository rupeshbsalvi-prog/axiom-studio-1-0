import React from "react";
import { spacing } from "@axiom/tokens";
import { forwardRef, classNames } from "@axiom/ui-foundation";
import { useBreakpoint, resolveResponsiveProp } from "../../hooks/useBreakpoint";

export type StackDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";
export type StackGap = keyof typeof spacing | "none" | string;

export interface StackProps {
  as?: React.ElementType;
  direction?: StackDirection | { mobile?: StackDirection; tablet?: StackDirection; desktop?: StackDirection };
  align?: StackAlign | { mobile?: StackAlign; tablet?: StackAlign; desktop?: StackAlign };
  justify?: StackJustify | { mobile?: StackJustify; tablet?: StackJustify; desktop?: StackJustify };
  wrap?: boolean | { mobile?: boolean; tablet?: boolean; desktop?: boolean };
  gap?: StackGap | { mobile?: StackGap; tablet?: StackGap; desktop?: StackGap };
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const mapAlign = (align: StackAlign): string => {
  switch (align) {
    case "start": return "flex-start";
    case "end": return "flex-end";
    case "center": return "center";
    case "stretch": return "stretch";
    case "baseline": return "baseline";
    default: return align;
  }
};

const mapJustify = (justify: StackJustify): string => {
  switch (justify) {
    case "start": return "flex-start";
    case "end": return "flex-end";
    case "center": return "center";
    case "between": return "space-between";
    case "around": return "space-around";
    case "evenly": return "space-evenly";
    default: return justify;
  }
};

export const Stack = forwardRef<StackProps, "div">(
  (
    {
      as: Tag = "div",
      direction = "column",
      align = "stretch",
      justify = "start",
      wrap = false,
      gap = "none",
      className,
      style,
      children,
      ...props
    }: StackProps,
    ref: React.Ref<any>
  ) => {
    const bp = useBreakpoint();

    const resolvedDirection = resolveResponsiveProp(direction, bp, "column" as StackDirection);
    const resolvedAlign = resolveResponsiveProp(align, bp, "stretch" as StackAlign);
    const resolvedJustify = resolveResponsiveProp(justify, bp, "start" as StackJustify);
    const resolvedWrap = resolveResponsiveProp(wrap, bp, false);
    const resolvedGap = resolveResponsiveProp(gap, bp, "none" as StackGap);

    const getGapValue = (g: StackGap): string => {
      if (g === "none") return "0rem";
      if (typeof g === "string" && g in spacing) {
        return spacing[g as keyof typeof spacing] as string;
      }
      return g as string;
    };

    const mergedStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: resolvedDirection,
      alignItems: mapAlign(resolvedAlign),
      justifyContent: mapJustify(resolvedJustify),
      flexWrap: resolvedWrap ? "wrap" : "nowrap",
      gap: getGapValue(resolvedGap),
      ...style,
    };

    return (
      <Tag
        ref={ref}
        className={classNames("ax-stack", className)}
        style={mergedStyle}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

(Stack as any).displayName = "Stack";

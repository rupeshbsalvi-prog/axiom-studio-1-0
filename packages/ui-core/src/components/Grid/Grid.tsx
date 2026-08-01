import React from "react";
import { spacing } from "@axiom/tokens";
import { forwardRef, classNames } from "@axiom/ui-foundation";
import { useBreakpoint, resolveResponsiveProp } from "../../hooks/useBreakpoint";

export type GridColumns = number | string;
export type GridGap = keyof typeof spacing | "none" | string;
export type GridFlow = "row" | "column" | "dense" | "row dense" | "column dense";
export type GridAlign = "start" | "center" | "end" | "stretch";
export type GridJustify = "start" | "center" | "end" | "stretch" | "between" | "around" | "evenly";

export interface GridProps {
  as?: React.ElementType;
  columns?: GridColumns | { mobile?: GridColumns; tablet?: GridColumns; desktop?: GridColumns };
  gap?: GridGap | { mobile?: GridGap; tablet?: GridGap; desktop?: GridGap };
  flow?: GridFlow | { mobile?: GridFlow; tablet?: GridFlow; desktop?: GridFlow };
  align?: GridAlign | { mobile?: GridAlign; tablet?: GridAlign; desktop?: GridAlign };
  justify?: GridJustify | { mobile?: GridJustify; tablet?: GridJustify; desktop?: GridJustify };
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const mapAlign = (align: GridAlign): string => {
  switch (align) {
    case "start": return "start";
    case "end": return "end";
    case "center": return "center";
    case "stretch": return "stretch";
    default: return align;
  }
};

const mapJustify = (justify: GridJustify): string => {
  switch (justify) {
    case "start": return "start";
    case "end": return "end";
    case "center": return "center";
    case "stretch": return "stretch";
    case "between": return "space-between";
    case "around": return "space-around";
    case "evenly": return "space-evenly";
    default: return justify;
  }
};

export const Grid = forwardRef<GridProps, "div">(
  (
    {
      as: Tag = "div",
      columns = 1,
      gap = "none",
      flow = "row",
      align = "stretch",
      justify = "stretch",
      className,
      style,
      children,
      ...props
    }: GridProps,
    ref: React.Ref<any>
  ) => {
    const bp = useBreakpoint();

    const resolvedColumns = resolveResponsiveProp(columns, bp, 1 as GridColumns);
    const resolvedGap = resolveResponsiveProp(gap, bp, "none" as GridGap);
    const resolvedFlow = resolveResponsiveProp(flow, bp, "row" as GridFlow);
    const resolvedAlign = resolveResponsiveProp(align, bp, "stretch" as GridAlign);
    const resolvedJustify = resolveResponsiveProp(justify, bp, "stretch" as GridJustify);

    const getColumnsTemplate = (cols: GridColumns) => {
      if (typeof cols === "number") {
        return `repeat(${cols}, minmax(0, 1fr))`;
      }
      return cols;
    };

    const getGapValue = (g: GridGap): string => {
      if (g === "none") return "0rem";
      if (typeof g === "string" && g in spacing) {
        return spacing[g as keyof typeof spacing] as string;
      }
      return g as string;
    };

    const mergedStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: getColumnsTemplate(resolvedColumns),
      gap: getGapValue(resolvedGap),
      gridAutoFlow: resolvedFlow,
      alignItems: mapAlign(resolvedAlign),
      justifyContent: mapJustify(resolvedJustify),
      ...style,
    };

    return (
      <Tag
        ref={ref}
        className={classNames("ax-grid", className)}
        style={mergedStyle}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

(Grid as any).displayName = "Grid";

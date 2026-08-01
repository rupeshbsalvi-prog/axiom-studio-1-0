import React from "react";

export type IconName =
  | "check"
  | "close"
  | "warning"
  | "success"
  | "info"
  | "chevron-down"
  | "chevron-right"
  | "spinner";

export const ICON_REGISTRY: Record<IconName, () => React.ReactNode> = {
  check: () => React.createElement("polyline", { points: "20 6 9 17 4 12" }),
  close: () => React.createElement(React.Fragment, null,
    React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ),
  warning: () => React.createElement(React.Fragment, null,
    React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
    React.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
    React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ),
  success: () => React.createElement(React.Fragment, null,
    React.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
    React.createElement("polyline", { points: "22 4 12 14.01 9 11.01" })
  ),
  info: () => React.createElement(React.Fragment, null,
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
    React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
  ),
  "chevron-down": () => React.createElement("polyline", { points: "6 9 12 15 18 9" }),
  "chevron-right": () => React.createElement("polyline", { points: "9 18 15 12 9 6" }),
  spinner: () => React.createElement("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }),
};

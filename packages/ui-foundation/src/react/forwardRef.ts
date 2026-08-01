import React from "react";
import { As, PolymorphicPropsWithRef } from "../types/polymorphic";

export function forwardRef<P = {}, DefaultTag extends As = "div">(
  render: (props: P & { as?: As }, ref: React.Ref<any>) => React.ReactElement | null
): <T extends As = DefaultTag>(props: PolymorphicPropsWithRef<T, P>) => React.ReactElement | null {
  return React.forwardRef(render as any) as any;
}

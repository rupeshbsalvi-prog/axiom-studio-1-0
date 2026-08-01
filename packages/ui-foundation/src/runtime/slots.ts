import React from "react";
import { classNames } from "./classNames";

export const Slot = React.forwardRef<any, React.HTMLAttributes<any> & { children: React.ReactElement }>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null;
    }

    const childProps = children.props as any;
    const mergedProps = {
      ...props,
      ...childProps,
      className: classNames((props as any).className, childProps.className),
      style: { ...(props as any).style, ...childProps.style },
    };

    const childRef = (children as any).ref;
    const mergedRef = (node: any) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as any).current = node;
      }

      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef) {
        (childRef as any).current = node;
      }
    };

    return React.cloneElement(children, {
      ...mergedProps,
      ref: mergedRef,
    } as any);
  }
);

Slot.displayName = "Slot";

import React from "react";

export type As = React.ElementType;

export type PropsOf<T extends As> = React.ComponentPropsWithoutRef<T>;

export type PolymorphicProps<T extends As, P = {}> = P & {
  as?: T;
} & Omit<PropsOf<T>, keyof P | "as">;

export type PolymorphicRef<T extends As> = React.ComponentPropsWithRef<T>["ref"];

export type PolymorphicPropsWithRef<T extends As, P = {}> = PolymorphicProps<T, P> & {
  ref?: PolymorphicRef<T>;
};

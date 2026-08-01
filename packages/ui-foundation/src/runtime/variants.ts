import { classNames } from "./classNames";

export function getVariantClassName(
  baseClass: string,
  variant?: string,
  size?: string
): string {
  return classNames(
    baseClass,
    variant ? `${baseClass}--variant-${variant}` : undefined,
    size ? `${baseClass}--size-${size}` : undefined
  );
}

export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function classNames(...args: ClassValue[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "string" || typeof arg === "number") {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      if (arg.length > 0) {
        const inner = classNames(...arg);
        if (inner) classes.push(inner);
      }
    } else if (typeof arg === "object") {
      for (const key in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(" ");
}

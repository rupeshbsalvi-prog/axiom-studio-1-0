export function mapStateToDataAttributes(
  states: Record<string, boolean | string | number | undefined | null>
): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const [key, value] of Object.entries(states)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }
    const kebabKey = `data-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    attributes[kebabKey] = String(value);
  }

  return attributes;
}

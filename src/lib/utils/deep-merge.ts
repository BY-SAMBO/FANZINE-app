/**
 * Deep merge utility for product updates.
 * Preserves nested fields during PATCH updates.
 * Only overwrites fields that are explicitly provided.
 */

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>
): T {
  const output = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (sourceVal === undefined) {
        continue;
      }

      if (sourceVal === null) {
        (output as Record<string, unknown>)[key] = null;
      } else if (isObject(sourceVal) && isObject(targetVal)) {
        (output as Record<string, unknown>)[key] = deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as DeepPartial<Record<string, unknown>>
        );
      } else {
        (output as Record<string, unknown>)[key] = sourceVal;
      }
    }
  }

  return output;
}

import { type t, Is } from './common.ts';

type E = t.DeepMutable<t.SlugFromYamlResult['errors']>;

/**
 * Semantic validation rules.
 * "Semantic" = "is the object logically valid?" (higher-order rules).
 */
export const SlugRules = {
  aliasUniqueness(mutErrors: E['semantic'], path: t.ObjectPath, slug?: unknown): boolean {
    if (!slug || !Array.isArray(slug)) return false;

    const seen = new Map<string, number[]>();
    (slug as any).traits.forEach((t: any, i: number) => {
      if (Is.string(t?.as)) {
        const arr = seen.get(t.as) ?? [];
        arr.push(i);
        seen.set(t.as, arr);
      }
    });

    for (const [alias, idxs] of seen.entries()) {
      if (idxs.length > 1) {
        mutErrors.push({
          path: [...path, 'traits'],
          message: `Duplicate alias "${alias}"`,
        });
      }
    }

    return mutErrors.length === 0;
  },
} as const;

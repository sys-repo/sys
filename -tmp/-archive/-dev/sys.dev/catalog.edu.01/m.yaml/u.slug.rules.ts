import { type t, Is } from './common.ts';

/**
 * Semantic validation rules.
 * "Semantic" = "is the object logically valid?" (higher-order rules).
 *
 * NOTE:
 * - All `path` values emitted here are RELATIVE to the slug root.
 *   The normalizer (`Slug.Error.normalize`) is responsible for prefixing the base path.
 */
export const SlugRules: t.SlugRuleSuite = {
  aliasUniqueness(mutErrors, _base, slug): boolean {
    const traits = readTraits(slug);

    const seen = new Map<string, number[]>();
    traits.forEach((tb: t.SlugTraitBindingLike, i: number) => {
      const a = tb?.as;
      if (typeof a === 'string') {
        const arr = seen.get(a) ?? [];
        arr.push(i);
        seen.set(a, arr);
      }
    });

    for (const [alias, idxs] of seen.entries()) {
      if (idxs.length > 1) {
        for (const i of idxs) {
          mutErrors.push({
            kind: 'semantic',
            path: ['traits', i, 'as'], // relative
            message: `Duplicate alias "${alias}"`,
          });
        }
      }
    }

    return mutErrors.length === 0;
  },

  traitTypeKnown(mutErrors, _base, slug, ctx): boolean {
    const isKnown = ctx?.isKnown;
    if (!isKnown) return true; // no registry available → skip

    const traits = readTraits(slug);

    traits.forEach((tb: t.SlugTraitBindingLike, i: number) => {
      const of = tb?.of;
      if (typeof of === 'string' && !isKnown(of)) {
        mutErrors.push({
          kind: 'semantic',
          path: ['traits', i, 'of'], // relative
          message: `Unknown trait id "${of}"`,
        });
      }
    });

    return true;
  },

  missingDataForAlias(mutErrors, _base, slug): boolean {
    const traits = readTraits(slug);
    const data = readData(slug);
    if (!data) return true;

    traits.forEach((tb: t.SlugTraitBindingLike, i: number) => {
      const key = tb?.as;
      if (typeof key === 'string' && !(key in data)) {
        mutErrors.push({
          kind: 'semantic',
          path: ['traits', i, 'as'], // relative
          message: `Missing data for alias "${key}"`,
        });
      }
    });

    return true;
  },

  orphanData(mutErrors, _base, slug): boolean {
    const traits = readTraits(slug);
    const data = readData(slug);
    if (!data) return true;

    const aliases = new Set<string>(
      traits
        .map((tb: t.SlugTraitBindingLike) => (Is.string(tb?.as) ? (tb.as as string) : undefined))
        .filter((v: string | undefined): v is string => Is.string(v)),
    );

    for (const key of Object.keys(data)) {
      if (!aliases.has(key)) {
        mutErrors.push({
          kind: 'semantic',
          path: ['data', key], // ← relative
          message: `Orphan data for non-existent alias "${key}"`,
        });
      }
    }

    return true;
  },
};

/**
 * Helpers:
 */
function readTraits(slug: unknown): readonly t.SlugTraitBindingLike[] {
  // Normalize to a readonly array of loose bindings:
  const s = slug as { traits?: unknown } | undefined;
  const traits = Array.isArray(s?.traits) ? (s!.traits as unknown[]) : [];
  return traits as readonly t.SlugTraitBindingLike[];
}

function readData(slug: unknown): Readonly<Record<string, unknown>> | undefined {
  const s = slug as { data?: unknown } | undefined;
  const d = s?.data;
  return Is.record(d) ? (d as Readonly<Record<string, unknown>>) : undefined;
}

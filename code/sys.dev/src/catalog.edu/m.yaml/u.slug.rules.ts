import { type t, Is } from './common.ts';

type O = Record<string, unknown>;

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
    const s = slug as t.Slug | undefined;
    const traits = Array.isArray(s?.traits) ? s!.traits : [];

    const seen = new Map<string, number[]>();
    traits.forEach((tb, i) => {
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

    const s = slug as t.Slug | undefined;
    const traits = Array.isArray(s?.traits) ? s!.traits : [];

    traits.forEach((tb, i) => {
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
    const s = slug as t.Slug | undefined;
    const traits = Array.isArray(s?.traits) ? s!.traits : [];
    const data = (s as unknown as { data?: O } | undefined)?.data;

    if (!data || typeof data !== 'object') return true;

    traits.forEach((tb, i) => {
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
    const s = slug as t.Slug | undefined;
    const traits = Array.isArray(s?.traits) ? s!.traits : [];
    const aliases = new Set<string>(
      traits
        .map((tb) => (Is.string(tb?.as) ? tb.as : undefined))
        .filter((v): v is string => Is.string(v)),
    );

    const data = (s as unknown as { data?: O } | undefined)?.data;
    if (!Is.record(data)) return true;

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

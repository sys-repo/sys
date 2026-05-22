import { type t, Is } from '../common.ts';

export function readTraits(slug: unknown) {
  const s = slug as any;
  const traits = Array.isArray(s?.traits) ? s.traits : [];
  const d = s?.data;
  const data = Is.record(d) ? (d as Record<string, unknown>) : undefined;
  return { traits, data };
}

export function indexAliases(traits: any[]): t.SlugTraitAliasIndex {
  const byAlias = new Map<string, number[]>();
  for (let i = 0; i < traits.length; i++) {
    const as = traits[i]?.as;
    if (!Is.string(as)) continue;

    const arr = byAlias.get(as) ?? [];
    arr.push(i);
    byAlias.set(as, arr);
  }
  return {
    byAlias,
    aliases: Array.from(byAlias.keys()),
  };
}

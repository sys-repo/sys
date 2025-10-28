import { type t, Is } from './common.ts';

/**
 * Apply per-trait normalizers to a slug's `data[as]` payloads.
 * - Pure: never mutates the input; returns either the original or a shallow-cloned object.
 * - Only runs when:
 *    • `normalizers` is provided,
 *    • `slug` is a record,
 *    • `slug.traits` is an array,
 *    • `slug.data` is a record,
 *    • a trait has `{ of: string, as: nonEmpty string }`,
 *    • a matching normalizer exists,
 *    • and `data[as]` is present.
 * - If a normalizer returns `undefined`, the authored value is left unchanged.
 */
export const applyTraitNormalizers = (slug: unknown, normalizers?: t.TraitNormalizers): unknown => {
  if (!normalizers) return slug;
  if (!Is.record(slug)) return slug;

  const traits = Array.isArray((slug as { traits?: unknown }).traits)
    ? ((slug as { traits: unknown[] }).traits as Array<Record<string, unknown>>)
    : [];

  const dataRec = ((): Record<string, unknown> | undefined => {
    const d = (slug as { data?: unknown }).data;
    return Is.record(d) ? (d as Record<string, unknown>) : undefined;
  })();

  if (!dataRec || traits.length === 0) return slug;

  let out = slug as Record<string, unknown>;
  let outData = dataRec;
  let changed = false;

  const ensureClone = () => {
    if (!changed) {
      // Shallow clone slug and its `data` container only when first change occurs.
      out = { ...out, data: { ...dataRec } };
      outData = out.data as Record<string, unknown>;
      changed = true;
    }
  };

  for (const tb of traits) {
    const id = (tb as { of?: unknown })?.of;
    const as = (tb as { as?: unknown })?.as;

    if (!Is.string(id)) continue;
    if (!Is.string(as) || as.length === 0) continue;

    const normalize = normalizers[id];
    if (!normalize) continue;

    if (Object.prototype.hasOwnProperty.call(dataRec, as)) {
      const authored = dataRec[as];
      const canonical = normalize(authored);

      // Only write back when the normalizer returns a defined value.
      if (canonical !== undefined && canonical !== authored) {
        ensureClone();
        outData[as] = canonical;
      }
    }
  }

  return changed ? out : slug;
};

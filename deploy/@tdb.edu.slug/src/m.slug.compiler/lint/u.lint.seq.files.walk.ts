import { type t, Fs, Is, Slug } from './common.ts';

type O = Record<string, unknown>;
type Facet = t.SlugLintFacet;

/**
 * Walk all media (video/image) file paths in a sequence for a given document:
 * - Resolves via alias tables.
 * - Yields the concrete filesystem path (if resolvable) plus existence flag.
 * - Covers:
 *    • sequence[].video
 *    • sequence[].image
 *    • sequence[].timestamps[*].image
 */
export async function walkSequenceMediaPaths(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  facets: Facet[],
  visit: t.LintMediaWalkVisitor,
) {
  const Parse = Slug.parser(yamlPath);
  const node = Parse.findParsedNode(dag, docid);
  const Path = Parse.path(dag, docid);
  const MediaComposition = Slug.Trait.MediaComposition;

  const result = await MediaComposition.Sequence.fromDag(dag, yamlPath, docid, { validate: false });

  // If we cannot resolve aliases or sequence for this document, we skip.
  if (!Path.ok || !node || !result.ok) return;

  const seq = result.sequence;

  const isSupported = (kind: t.SlugAssetKind) => {
    if (kind === 'image') return facets.includes('sequence:file:image');
    if (kind === 'video') return facets.includes('sequence:file:video');
    return false;
  };

  const processMedia = async (kind: t.SlugAssetKind, rawValue: unknown) => {
    if (!Is.str(rawValue)) return;
    if (!isSupported(kind)) return;

    const raw = rawValue;

    try {
      const resolved = Path.resolve(raw);
      const path = Fs.Tilde.expand(resolved?.value ?? '');
      if (!path) return;

      const exists = await Fs.exists(path);
      await visit({ kind, raw, resolvedPath: path, exists });
    } catch (error) {
      await visit({
        kind,
        raw,
        resolvedPath: '',
        exists: false,
        error,
      });
    }
  };

  for (const item of seq) {
    if (!item || typeof item !== 'object') continue;

    const anyItem = item as O;

    // Top-level media on the sequence item.
    await processMedia('video', anyItem['video']);
    await processMedia('image', anyItem['image']);

    // Nested images within timestamps.
    const timestamps = anyItem['timestamps'];
    if (!timestamps || typeof timestamps !== 'object') continue;

    for (const value of Object.values(timestamps as O)) {
      if (!value || typeof value !== 'object') continue;
      const entry = value as O;
      await processMedia('image', entry['image']);
    }
  }
}

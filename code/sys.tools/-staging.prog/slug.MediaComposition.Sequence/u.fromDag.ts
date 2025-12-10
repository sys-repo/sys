import { type t, makeParser } from './common.ts';
import { normalizeEditorSequenceForTypedYaml } from './u.normalize.ts';
import { validateSequence } from './u.schema.validate.ts';

type O = Record<string, unknown>;

/**
 * Derive a Sequence array from a Slug node within a DAG.
 *
 * Source of truth:
 *   - Slug YAML (resolved via makeParser/yamlPath)
 *   - Traits (must advertise `{ of: 'media-composition', as: 'sequence' }`)
 *   - `data.sequence` (or future trait-configured path)
 *
 * Notes:
 *   - Alias resolvers are deliberately *not* used here; they are for hrefs,
 *     not for discovering the sequence items themselves.
 */
export const fromDag: t.SequenceLib['fromDag'] = async (dag, yamlPath, docid, opts = {}) => {
  const { validate = false } = opts;

  const parser = makeParser(yamlPath);

  // Locate the node in the DAG via the slug parser helpers.
  const { ok, node } = parser.path(dag, docid);
  if (!ok || !node) return;

  // Pull out the slug parts we care about (sequence + traits).
  const { sequence, traits } = parser.Resolve.slugParts(node.node);

  // Require that this slug advertises a media-composition sequence trait.
  const hasMediaSequenceTrait = (traits ?? []).some(
    (trait): trait is t.SlugTraits.MediaComposition.Sequence =>
      trait.of === 'media-composition' && trait.as === 'sequence',
  );
  if (!hasMediaSequenceTrait) return;

  // Raw YAML sequence from the slug node (as authored in the editor).
  const seqRaw = (sequence ?? []) as O[];

  // Normalize loose editor YAML into the typed-YAML shape.
  const normalized = normalizeEditorSequenceForTypedYaml(seqRaw);
  if (!normalized) return;
  if (!validate) return normalized as t.SequenceItem[];

  // Validate against the schema-backed Sequence.validate.
  const result = validateSequence(normalized);
  if (!result.ok) return;

  return result.sequence;
};

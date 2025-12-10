import { type t, Is, makeParser, Obj } from './common.ts';
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
  const { data, traits = [] } = parser.Resolve.slugParts(node.node);

  // Require that this slug advertises a media-composition sequence trait.
  const trait = traits.find((trait) => trait.of === 'media-composition');
  if (!trait || !Is.str(trait.as)) return;

  // Raw YAML sequence from the slug node (as authored in the editor).
  const lens = Obj.Lens.at<O[]>([trait.as]);
  const seqRaw = (lens.get(data) ?? []) as O[];

  // Normalize loose editor YAML into the typed-YAML shape.
  const normalized = normalizeEditorSequenceForTypedYaml(seqRaw);
  if (!normalized) return;
  if (!validate) return normalized;

  // Validate against the schema-backed Sequence.validate.
  const result = validateSequence(normalized);
  return result.ok ? result.sequence : undefined;
};

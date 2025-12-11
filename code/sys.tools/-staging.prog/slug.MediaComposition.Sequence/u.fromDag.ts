import { type t, Is, makeParser, Obj } from './common.ts';
import { normalizeEditorSequenceForTypedYaml } from './u.normalize.ts';
import { validateSequence } from './u.schema.validate.ts';

type O = Record<string, unknown>;
type R = t.ValidateResult<t.SequenceItem[]>;

/**
 * Derive a Sequence array from a Slug node within a DAG.
 *
 * Source of truth:
 *   - Slug YAML (resolved via makeParser/yamlPath)
 *   - Traits (must advertise `{ of: 'media-composition', as: 'sequence' }`)
 *   - `data[trait.as]` (typically `data.sequence`)
 *
 * Notes:
 *   - Alias resolvers are deliberately *not* used here; they are for hrefs,
 *     not for discovering the sequence items themselves.
 */
export const fromDag: t.SequenceLib['fromDag'] = async (dag, yamlPath, docid, opts = {}) => {
  const { validate = false } = opts;

  const ok = (sequence: t.SequenceItem[]): R => ({ ok: true, sequence });
  const fail = (message: string): R => ({ ok: false, error: new Error(message) });
  const parser = makeParser(yamlPath);

  /**
   * Locate the node in the DAG via the slug parser helpers.
   */
  const { ok: pathOk, node } = parser.path(dag, docid);
  if (!pathOk || !node) {
    const pathStr = yamlPath.join('/');
    return fail(`Slug not found for doc "${docid}" at YAML path "${pathStr}".`);
  }

  /**
   * Pull out the slug parts we care about (sequence + traits).
   */
  const { data, traits = [] } = parser.Resolve.slugParts(node.node);

  /**
   * Require that this slug advertises a media-composition sequence trait.
   */
  const trait = traits.find((trait) => trait.of === 'media-composition');
  if (!trait || !Is.str(trait.as)) {
    const err = `Slug "${docid}" does not advertise a "media-composition" sequence trait (expected {of:"media-composition", as:string}).`;
    return fail(err);
  }

  /**
   * Raw YAML sequence from the slug node (as authored in the editor).
   * We currently treat `data[trait.as]` as the source array.
   */
  const lens = Obj.Lens.at<O[]>([trait.as]);
  const seqRaw = lens.get(data);

  if (!Array.isArray(seqRaw)) {
    const err = `Slug "${docid}" has no array at "data.${trait.as}" (expected an authoring-time sequence array).`;
    return fail(err);
  }

  /**
   * Normalize loose editor YAML into the typed-YAML shape.
   */
  const normalized = normalizeEditorSequenceForTypedYaml(seqRaw);
  if (!normalized) {
    const err = `Unable to normalize authoring-time sequence for slug "${docid}" into the typed YAML shape.`;
    return fail(err);
  }

  /**
   * Optionally run full schema + invariant validation.
   */
  return validate ? validateSequence(normalized) : ok(normalized);
};

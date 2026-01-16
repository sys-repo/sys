import { type t, makeParser, Obj, Traits } from './common.ts';
import { normalizeEditorSequenceForTypedYaml } from './u.normalize.dsl.ts';
import { validateSequence } from '../../m.slug.schema/slug.MediaComposition.Sequence/u.schema.validate.ts';

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
    const pathStr = yamlPath.length > 0 ? yamlPath.join('/') : '(root)';
    return fail(`Slug not found for doc "${docid}" at YAML path "${pathStr}".`);
  }

  /**
   * Pull out the slug parts we care about (sequence + traits).
   */
  const { data, traits = [] } = parser.Resolve.slugParts(node.node);
  const defaultTrait: t.SlugTraitGateOptions = { of: 'media-composition' };
  const traitOpt = opts.trait === undefined ? defaultTrait : opts.trait;

  const gate = Traits.gateAs({ traits, opt: traitOpt });
  if (!gate.ok) return fail(gate.error.message);

  if (!gate.enabled) {
    // opt === null  → explicit opt-out (callers must not expect this op to succeed)
    // opt undefined → no gating requested (should not happen here due to defaultTrait)
    const err = `Trait gating disabled for slug "${docid}" (opts.trait === null).`;
    return fail(err);
  }

  const as = gate.as;

  /**
   * Raw YAML sequence from the slug node (as authored in the editor).
   * We currently treat `data[trait.as]` as the source array.
   */
  const lens = Obj.Lens.at<O[]>([as]);
  const seqRaw = lens.get(data);

  if (!Array.isArray(seqRaw)) {
    const err = `Slug "${docid}" has no array at "data.${as}" (expected an authoring-time sequence array).`;
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
   *
   * On failure, we prefix the invariant/schema message with the concrete
   * authoring path `data.<trait.as>` so callers and lints get a useful,
   * path-anchored error instead of a generic "Invalid sequence".
   */
  if (!validate) return ok(normalized);

  const result = validateSequence(normalized);
  if (result.ok) return result;

  const base = result.error.message.replace(/^Invalid sequence:\s*/, '');
  const message = `Invalid sequence at "data/${as}": ${base}`;
  return {
    ok: false,
    error: new Error(message),
  };
};

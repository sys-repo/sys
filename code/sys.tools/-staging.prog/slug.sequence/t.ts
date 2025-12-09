import type { t } from '../common.ts';

/** Type exports */
export type * from './t.seq.ts';
export type * from './t.normalize.ts';

type Dag = t.Graph.Dag.Result;

/**
 * Slug sequence tools.
 */
export type SlugSequenceLib = {
  readonly Is: SlugSequenceIsLib;
  readonly Normalize: t.SlugSequenceNormalizeLib;
  validate(input: unknown): t.ValidateResult<t.Sequence>;
  fromDag(
    dag: Dag,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: SlugSequenceFromDagOptions,
  ): Promise<t.Sequence | undefined>;
};

/**
 * Type guards.
 */
export type SlugSequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes
   * (but not actually schema validated).
   */
  itemLike(value: unknown): value is t.SequenceItem;
};

/**
 * Slug-specific projection from the authoring-time slug sequence
 * into the generic timecode composition model.
 */
export type SlugSequenceNormalizeLib = {
  /** Normalized result of lowering the YAML DSL to a timecode `Sequence`. */
  toTimecode(
    sequence: t.Sequence,
    opts?: { docid?: t.Crdt.Id; yamlPath?: t.ObjectPath },
  ): t.SlugSequenceNormalized;
};

/** Options for `Sequence.fromDag` method */
export type SlugSequenceFromDagOptions = { readonly validate?: boolean };

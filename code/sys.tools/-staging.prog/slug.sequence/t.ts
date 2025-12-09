import type { t } from '../common.ts';

/** Type exports */
export type * from './t.seq.ts';
export type * from './t.normalize.ts';

type Dag = t.Graph.Dag.Result;

/**
 * Slug sequence tools.
 */
export type SequenceLib = {
  readonly Is: SequenceIsLib;
  readonly Normalize: t.SequenceNormalizeLib;
  validate(input: unknown): t.ValidateResult<t.Sequence>;
  fromDag(
    dag: Dag,
    yamlPath: t.ObjectPath,
    docid: t.Crdt.Id,
    opts?: SequenceFromDagOptions,
  ): Promise<t.Sequence | undefined>;
};

/**
 * Type guards.
 */
export type SequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes
   * (but not actually schema validated).
   */
  itemLike(value: unknown): value is t.SequenceItem;
};

/**
 *
 */
export type SequenceNormalizeLib = {
  /** Normalized result of lowering the YAML DSL to a timecode `Sequence`. */
  toTimecode(
    sequence: t.Sequence,
    opts?: { docid?: t.Crdt.Id; yamlPath?: t.ObjectPath },
  ): t.SequenceNormalized;
};

/** Options for `Sequence.fromDag` method */
export type SequenceFromDagOptions = { readonly validate?: boolean };
